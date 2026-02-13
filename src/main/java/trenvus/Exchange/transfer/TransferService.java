package trenvus.Exchange.transfer;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import trenvus.Exchange.tx.TransactionEntity;
import trenvus.Exchange.tx.TransactionRepository;
import trenvus.Exchange.tx.TransactionType;
import trenvus.Exchange.user.UserRepository;
import trenvus.Exchange.wallet.Currency;
import trenvus.Exchange.wallet.WalletRepository;
import trenvus.Exchange.wallet.WalletService;

@Service
public class TransferService {
	private final UserRepository users;
	private final WalletService walletService;
	private final WalletRepository wallets;
	private final TransactionRepository transactions;

	public TransferService(UserRepository users, WalletService walletService, WalletRepository wallets, TransactionRepository transactions) {
		this.users = users;
		this.walletService = walletService;
		this.wallets = wallets;
		this.transactions = transactions;
	}

	@Transactional
	public TransferResult transferTrv(Long fromUserId, String toEmail, long amountTrvCents) {
		if (toEmail == null || toEmail.isBlank()) {
			throw new IllegalArgumentException("Destinatário inválido");
		}

		var toRef = toEmail.trim();
		var toUser = resolveRecipient(toRef);
		var toUserId = toUser.getId();

		if (fromUserId.equals(toUserId)) {
			throw new IllegalArgumentException("Não é possível transferir para si mesmo");
		}

		if (amountTrvCents <= 0) {
			throw new IllegalArgumentException("Valor deve ser maior que zero");
		}

		walletService.ensureUserWallets(fromUserId);
		walletService.ensureUserWallets(toUserId);

		Long first = fromUserId < toUserId ? fromUserId : toUserId;
		Long second = fromUserId < toUserId ? toUserId : fromUserId;

		var firstLocked = wallets.findForUpdate(first, List.of(Currency.TRV));
		var secondLocked = wallets.findForUpdate(second, List.of(Currency.TRV));

		var fromWallet = (fromUserId.equals(first) ? firstLocked : secondLocked).stream()
				.filter(w -> w.getCurrency() == Currency.TRV)
				.findFirst()
				.orElseThrow();
		var toWallet = (toUserId.equals(first) ? firstLocked : secondLocked).stream()
				.filter(w -> w.getCurrency() == Currency.TRV)
				.findFirst()
				.orElseThrow();

		if (fromWallet.getBalanceCents() < amountTrvCents) {
			throw new IllegalArgumentException("Saldo insuficiente");
		}

		fromWallet.setBalanceCents(fromWallet.getBalanceCents() - amountTrvCents);
		toWallet.setBalanceCents(Math.addExact(toWallet.getBalanceCents(), amountTrvCents));

		var outTx = new TransactionEntity();
		outTx.setUserId(fromUserId);
		outTx.setType(TransactionType.TRANSFER_TRV_OUT);
		outTx.setTrvAmountCents(amountTrvCents);
		transactions.save(outTx);

		var inTx = new TransactionEntity();
		inTx.setUserId(toUserId);
		inTx.setType(TransactionType.TRANSFER_TRV_IN);
		inTx.setTrvAmountCents(amountTrvCents);
		transactions.save(inTx);

		var snapshot = walletService.getSnapshot(fromUserId);
		return new TransferResult(snapshot.usdCents(), snapshot.trvCents(), outTx.getId(), 0);
	}

	private trenvus.Exchange.user.UserEntity resolveRecipient(String toRef) {
		if (toRef.contains("@")) {
			return users.findByEmail(toRef).orElseThrow(() -> new IllegalArgumentException("Destinatário não encontrado"));
		}

		var matches = users.findAllByNicknameIgnoreCase(toRef);
		if (matches.isEmpty()) {
			throw new IllegalArgumentException("Destinatário não encontrado");
		}
		if (matches.size() > 1) {
			throw new IllegalArgumentException("Apelido ambíguo");
		}
		return matches.get(0);
	}

	public record TransferResult(long usdCents, long trvCents, Long transactionId, long feeTrvCents) {}
}
