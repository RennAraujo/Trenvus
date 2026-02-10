package trenvus.Exchange.exchange;

import java.util.EnumMap;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import trenvus.Exchange.auth.AdminAccountConfig;
import trenvus.Exchange.tx.TransactionEntity;
import trenvus.Exchange.tx.TransactionRepository;
import trenvus.Exchange.tx.TransactionType;
import trenvus.Exchange.user.UserRepository;
import trenvus.Exchange.wallet.Currency;
import trenvus.Exchange.wallet.WalletRepository;
import trenvus.Exchange.wallet.WalletService;

@Service
public class ExchangeService {
	public static final int CONVERSION_FEE_PERCENT = 1;
	public static final long MIN_DEPOSIT_USD_CENTS = 1_000;

	private final WalletRepository wallets;
	private final WalletService walletService;
	private final TransactionRepository transactions;
	private final UserRepository users;
	private final AdminAccountConfig adminAccount;

	public ExchangeService(
			WalletRepository wallets,
			WalletService walletService,
			TransactionRepository transactions,
			UserRepository users,
			AdminAccountConfig adminAccount
	) {
		this.wallets = wallets;
		this.walletService = walletService;
		this.transactions = transactions;
		this.users = users;
		this.adminAccount = adminAccount;
	}

	@Transactional
	public WalletOperationResult depositUsd(Long userId, long amountUsdCents) {
		if (amountUsdCents < MIN_DEPOSIT_USD_CENTS) {
			throw new IllegalArgumentException("deposit_minimum_usd_10");
		}
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
		return new WalletOperationResult(snapshot.usdCents(), snapshot.trvCents(), tx.getId());
	}

	@Transactional
	public ConvertResult convertUsdToTrv(Long userId, long amountUsdCents, String idempotencyKey) {
		walletService.ensureUserWallets(userId);

		if (idempotencyKey != null && !idempotencyKey.isBlank()) {
			var existing = transactions.findByUserIdAndIdempotencyKey(userId, idempotencyKey);
			if (existing.isPresent()) {
				var snapshot = walletService.getSnapshot(userId);
				var fee = existing.get().getFeeUsdCents() == null ? 0 : existing.get().getFeeUsdCents();
				return new ConvertResult(snapshot.usdCents(), snapshot.trvCents(), existing.get().getId(), fee);
			}
		} else {
			idempotencyKey = null;
		}

		long feeUsdCents = feeUsdCentsForConversion(amountUsdCents);
		Long adminUserId = resolveAdminUserIdOrNull();
		boolean creditFeeToAdmin = adminUserId != null && !adminUserId.equals(userId);
		if (creditFeeToAdmin) {
			walletService.ensureUserWallets(adminUserId);
		}
		trenvus.Exchange.wallet.WalletEntity adminUsdWallet = null;
		List<trenvus.Exchange.wallet.WalletEntity> lockedWallets;
		if (creditFeeToAdmin && adminUserId < userId) {
			var adminLocked = wallets.findForUpdate(adminUserId, List.of(Currency.USD));
			adminUsdWallet = adminLocked.stream().filter(w -> w.getCurrency() == Currency.USD).findFirst().orElseThrow();
			lockedWallets = wallets.findForUpdate(userId, List.of(Currency.USD, Currency.TRV));
		} else {
			lockedWallets = wallets.findForUpdate(userId, List.of(Currency.USD, Currency.TRV));
			if (creditFeeToAdmin) {
				var adminLocked = wallets.findForUpdate(adminUserId, List.of(Currency.USD));
				adminUsdWallet = adminLocked.stream().filter(w -> w.getCurrency() == Currency.USD).findFirst().orElseThrow();
			}
		}

		var map = new EnumMap<Currency, trenvus.Exchange.wallet.WalletEntity>(Currency.class);
		for (var w : lockedWallets) {
			map.put(w.getCurrency(), w);
		}
		var usdWallet = map.get(Currency.USD);
		var trvWallet = map.get(Currency.TRV);
		if (usdWallet == null || trvWallet == null) {
			throw new IllegalStateException("Carteira não inicializada");
		}

		long debitUsd = Math.addExact(amountUsdCents, feeUsdCents);
		if (usdWallet.getBalanceCents() < debitUsd) {
			throw new IllegalArgumentException("Saldo insuficiente");
		}

		usdWallet.setBalanceCents(usdWallet.getBalanceCents() - debitUsd);
		trvWallet.setBalanceCents(Math.addExact(trvWallet.getBalanceCents(), amountUsdCents));
		if (adminUsdWallet != null) {
			adminUsdWallet.setBalanceCents(Math.addExact(adminUsdWallet.getBalanceCents(), feeUsdCents));
		}

		var tx = new TransactionEntity();
		tx.setUserId(userId);
		tx.setType(TransactionType.CONVERT_USD_TO_TRV);
		tx.setUsdAmountCents(amountUsdCents);
		tx.setTrvAmountCents(amountUsdCents);
		tx.setFeeUsdCents(feeUsdCents);
		tx.setIdempotencyKey(idempotencyKey);

		try {
			transactions.save(tx);
			if (adminUsdWallet != null) {
				var feeTx = new TransactionEntity();
				feeTx.setUserId(adminUserId);
				feeTx.setType(TransactionType.FEE_INCOME_USD);
				feeTx.setUsdAmountCents(feeUsdCents);
				feeTx.setSourceUserId(userId);
				transactions.save(feeTx);
			}
		} catch (DataIntegrityViolationException ex) {
			if (idempotencyKey != null) {
				var existing = transactions.findByUserIdAndIdempotencyKey(userId, idempotencyKey).orElseThrow();
				var snapshot = walletService.getSnapshot(userId);
				var fee = existing.getFeeUsdCents() == null ? 0 : existing.getFeeUsdCents();
				return new ConvertResult(snapshot.usdCents(), snapshot.trvCents(), existing.getId(), fee);
			}
			throw ex;
		}

		var snapshot = walletService.getSnapshot(userId);
		return new ConvertResult(snapshot.usdCents(), snapshot.trvCents(), tx.getId(), feeUsdCents);
	}

	@Transactional
	public ConvertResult convertTrvToUsd(Long userId, long amountTrvCents, String idempotencyKey) {
		walletService.ensureUserWallets(userId);

		if (idempotencyKey != null && !idempotencyKey.isBlank()) {
			var existing = transactions.findByUserIdAndIdempotencyKey(userId, idempotencyKey);
			if (existing.isPresent()) {
				var snapshot = walletService.getSnapshot(userId);
				var fee = existing.get().getFeeUsdCents() == null ? 0 : existing.get().getFeeUsdCents();
				return new ConvertResult(snapshot.usdCents(), snapshot.trvCents(), existing.get().getId(), fee);
			}
		} else {
			idempotencyKey = null;
		}

		long feeUsdCents = feeUsdCentsForConversion(amountTrvCents);
		if (amountTrvCents <= feeUsdCents) {
			throw new IllegalArgumentException("Valor deve ser maior que a taxa");
		}

		Long adminUserId = resolveAdminUserIdOrNull();
		boolean creditFeeToAdmin = adminUserId != null && !adminUserId.equals(userId);
		if (creditFeeToAdmin) {
			walletService.ensureUserWallets(adminUserId);
		}
		trenvus.Exchange.wallet.WalletEntity adminUsdWallet = null;
		List<trenvus.Exchange.wallet.WalletEntity> lockedWallets;
		if (creditFeeToAdmin && adminUserId < userId) {
			var adminLocked = wallets.findForUpdate(adminUserId, List.of(Currency.USD));
			adminUsdWallet = adminLocked.stream().filter(w -> w.getCurrency() == Currency.USD).findFirst().orElseThrow();
			lockedWallets = wallets.findForUpdate(userId, List.of(Currency.USD, Currency.TRV));
		} else {
			lockedWallets = wallets.findForUpdate(userId, List.of(Currency.USD, Currency.TRV));
			if (creditFeeToAdmin) {
				var adminLocked = wallets.findForUpdate(adminUserId, List.of(Currency.USD));
				adminUsdWallet = adminLocked.stream().filter(w -> w.getCurrency() == Currency.USD).findFirst().orElseThrow();
			}
		}

		var map = new EnumMap<Currency, trenvus.Exchange.wallet.WalletEntity>(Currency.class);
		for (var w : lockedWallets) {
			map.put(w.getCurrency(), w);
		}
		var usdWallet = map.get(Currency.USD);
		var trvWallet = map.get(Currency.TRV);
		if (usdWallet == null || trvWallet == null) {
			throw new IllegalStateException("Carteira não inicializada");
		}

		if (trvWallet.getBalanceCents() < amountTrvCents) {
			throw new IllegalArgumentException("Saldo insuficiente");
		}

		long creditUsd = Math.subtractExact(amountTrvCents, feeUsdCents);
		trvWallet.setBalanceCents(trvWallet.getBalanceCents() - amountTrvCents);
		usdWallet.setBalanceCents(Math.addExact(usdWallet.getBalanceCents(), creditUsd));
		if (adminUsdWallet != null) {
			adminUsdWallet.setBalanceCents(Math.addExact(adminUsdWallet.getBalanceCents(), feeUsdCents));
		}

		var tx = new TransactionEntity();
		tx.setUserId(userId);
		tx.setType(TransactionType.CONVERT_TRV_TO_USD);
		tx.setUsdAmountCents(amountTrvCents);
		tx.setTrvAmountCents(amountTrvCents);
		tx.setFeeUsdCents(feeUsdCents);
		tx.setIdempotencyKey(idempotencyKey);

		try {
			transactions.save(tx);
			if (adminUsdWallet != null) {
				var feeTx = new TransactionEntity();
				feeTx.setUserId(adminUserId);
				feeTx.setType(TransactionType.FEE_INCOME_USD);
				feeTx.setUsdAmountCents(feeUsdCents);
				feeTx.setSourceUserId(userId);
				transactions.save(feeTx);
			}
		} catch (DataIntegrityViolationException ex) {
			if (idempotencyKey != null) {
				var existing = transactions.findByUserIdAndIdempotencyKey(userId, idempotencyKey).orElseThrow();
				var snapshot = walletService.getSnapshot(userId);
				var fee = existing.getFeeUsdCents() == null ? 0 : existing.getFeeUsdCents();
				return new ConvertResult(snapshot.usdCents(), snapshot.trvCents(), existing.getId(), fee);
			}
			throw ex;
		}

		var snapshot = walletService.getSnapshot(userId);
		return new ConvertResult(snapshot.usdCents(), snapshot.trvCents(), tx.getId(), feeUsdCents);
	}

	private static long feeUsdCentsForConversion(long amountCents) {
		long fee = Math.floorDiv(amountCents, 100);
		if (fee <= 0) {
			throw new IllegalArgumentException("Valor deve ser no mínimo 1.00");
		}
		return fee;
	}

	private Long resolveAdminUserIdOrNull() {
		if (!adminAccount.isEnabled()) {
			return null;
		}
		var email = adminAccount.email();
		if (email.isBlank()) {
			return null;
		}
		return users.findByEmail(email).map(u -> u.getId()).orElseThrow(() -> new IllegalStateException("admin_account_not_found"));
	}

	public record WalletOperationResult(long usdCents, long trvCents, Long transactionId) {}

	public record ConvertResult(long usdCents, long trvCents, Long transactionId, long feeUsdCents) {}
}
