package trenvus.Exchange.exchange;

import java.util.EnumMap;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import trenvus.Exchange.tx.TransactionEntity;
import trenvus.Exchange.tx.TransactionRepository;
import trenvus.Exchange.tx.TransactionType;
import trenvus.Exchange.wallet.Currency;
import trenvus.Exchange.wallet.WalletRepository;
import trenvus.Exchange.wallet.WalletService;

@Service
public class ExchangeService {
	public static final long CONVERSION_FEE_USD_CENTS = 50;

	private final WalletRepository wallets;
	private final WalletService walletService;
	private final TransactionRepository transactions;

	public ExchangeService(WalletRepository wallets, WalletService walletService, TransactionRepository transactions) {
		this.wallets = wallets;
		this.walletService = walletService;
		this.transactions = transactions;
	}

	@Transactional
	public WalletOperationResult depositUsd(Long userId, long amountUsdCents) {
		walletService.ensureUserWallets(userId);

		var locked = wallets.findForUpdate(userId, List.of(Currency.USD));
		var usdWallet = locked.stream().filter(w -> w.getCurrency() == Currency.USD).findFirst().orElseThrow();

		usdWallet.setBalanceCents(Math.addExact(usdWallet.getBalanceCents(), amountUsdCents));

		var tx = new TransactionEntity();
		tx.setUserId(userId);
		tx.setType(TransactionType.DEPOSIT_USD);
		tx.setUsdAmountCents(amountUsdCents);
		transactions.save(tx);

		var snapshot = walletService.getSnapshot(userId);
		return new WalletOperationResult(snapshot.usdCents(), snapshot.vpsCents(), tx.getId());
	}

	@Transactional
	public ConvertResult convertUsdToVps(Long userId, long amountUsdCents, String idempotencyKey) {
		walletService.ensureUserWallets(userId);

		if (idempotencyKey != null && !idempotencyKey.isBlank()) {
			var existing = transactions.findByUserIdAndIdempotencyKey(userId, idempotencyKey);
			if (existing.isPresent()) {
				var snapshot = walletService.getSnapshot(userId);
				return new ConvertResult(snapshot.usdCents(), snapshot.vpsCents(), existing.get().getId(), CONVERSION_FEE_USD_CENTS);
			}
		} else {
			idempotencyKey = null;
		}

		var lockedWallets = wallets.findForUpdate(userId, List.of(Currency.USD, Currency.VPS));
		var map = new EnumMap<Currency, trenvus.Exchange.wallet.WalletEntity>(Currency.class);
		for (var w : lockedWallets) {
			map.put(w.getCurrency(), w);
		}
		var usdWallet = map.get(Currency.USD);
		var vpsWallet = map.get(Currency.VPS);
		if (usdWallet == null || vpsWallet == null) {
			throw new IllegalStateException("Carteira não inicializada");
		}

		long debitUsd = Math.addExact(amountUsdCents, CONVERSION_FEE_USD_CENTS);
		if (usdWallet.getBalanceCents() < debitUsd) {
			throw new IllegalArgumentException("Saldo insuficiente");
		}

		usdWallet.setBalanceCents(usdWallet.getBalanceCents() - debitUsd);
		vpsWallet.setBalanceCents(Math.addExact(vpsWallet.getBalanceCents(), amountUsdCents));

		var tx = new TransactionEntity();
		tx.setUserId(userId);
		tx.setType(TransactionType.CONVERT_USD_TO_VPS);
		tx.setUsdAmountCents(amountUsdCents);
		tx.setVpsAmountCents(amountUsdCents);
		tx.setFeeUsdCents(CONVERSION_FEE_USD_CENTS);
		tx.setIdempotencyKey(idempotencyKey);

		try {
			transactions.save(tx);
		} catch (DataIntegrityViolationException ex) {
			if (idempotencyKey != null) {
				var existing = transactions.findByUserIdAndIdempotencyKey(userId, idempotencyKey).orElseThrow();
				var snapshot = walletService.getSnapshot(userId);
				return new ConvertResult(snapshot.usdCents(), snapshot.vpsCents(), existing.getId(), CONVERSION_FEE_USD_CENTS);
			}
			throw ex;
		}

		var snapshot = walletService.getSnapshot(userId);
		return new ConvertResult(snapshot.usdCents(), snapshot.vpsCents(), tx.getId(), CONVERSION_FEE_USD_CENTS);
	}

	public record WalletOperationResult(long usdCents, long vpsCents, Long transactionId) {}

	public record ConvertResult(long usdCents, long vpsCents, Long transactionId, long feeUsdCents) {}
}
