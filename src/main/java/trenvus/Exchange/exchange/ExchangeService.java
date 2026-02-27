package trenvus.Exchange.exchange;

import java.util.EnumMap;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import trenvus.Exchange.tx.TransactionEntity;
import trenvus.Exchange.tx.TransactionRepository;
import trenvus.Exchange.tx.TransactionType;
import trenvus.Exchange.user.UserRepository;
import trenvus.Exchange.user.UserRole;
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

	public ExchangeService(WalletRepository wallets, WalletService walletService, TransactionRepository transactions, UserRepository users) {
		this.wallets = wallets;
		this.walletService = walletService;
		this.transactions = transactions;
		this.users = users;
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

		var lockedWallets = wallets.findForUpdate(userId, List.of(Currency.USD, Currency.TRV));
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

		// Transfer fee to admin
		Long adminUserId = getAdminUserId();
		System.out.println("DEBUG USD->TRV: Admin user ID found: " + adminUserId);
		if (adminUserId != null && feeUsdCents > 0) {
			walletService.ensureUserWallets(adminUserId);
			var adminWallets = wallets.findForUpdate(adminUserId, List.of(Currency.USD));
			var adminUsdWallet = adminWallets.stream()
					.filter(w -> w.getCurrency() == Currency.USD)
					.findFirst()
					.orElse(null);
			System.out.println("DEBUG USD->TRV: Admin USD wallet found: " + (adminUsdWallet != null));
			if (adminUsdWallet != null) {
				adminUsdWallet.setBalanceCents(Math.addExact(adminUsdWallet.getBalanceCents(), feeUsdCents));
				System.out.println("DEBUG USD->TRV: Fee transferred to admin: " + feeUsdCents);
				
				// Create fee income transaction for admin
				var adminTx = new TransactionEntity();
				adminTx.setUserId(adminUserId);
				adminTx.setType(TransactionType.FEE_INCOME_USD);
				adminTx.setUsdAmountCents(feeUsdCents);
				adminTx.setSourceUserId(userId);
				transactions.save(adminTx);
			}
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

		var lockedWallets = wallets.findForUpdate(userId, List.of(Currency.USD, Currency.TRV));
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

		// Transfer fee to admin
		Long adminUserId = getAdminUserId();
		if (adminUserId != null && feeUsdCents > 0) {
			walletService.ensureUserWallets(adminUserId);
			var adminWallets = wallets.findForUpdate(adminUserId, List.of(Currency.USD));
			var adminUsdWallet = adminWallets.stream()
					.filter(w -> w.getCurrency() == Currency.USD)
					.findFirst()
					.orElse(null);
			if (adminUsdWallet != null) {
				adminUsdWallet.setBalanceCents(Math.addExact(adminUsdWallet.getBalanceCents(), feeUsdCents));
				
				// Create fee income transaction for admin
				var adminTx = new TransactionEntity();
				adminTx.setUserId(adminUserId);
				adminTx.setType(TransactionType.FEE_INCOME_USD);
				adminTx.setUsdAmountCents(feeUsdCents);
				adminTx.setSourceUserId(userId);
				transactions.save(adminTx);
			}
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

	private Long getAdminUserId() {
		// Try to find by ADMIN role
		var admin = users.findAll().stream()
				.filter(u -> u.getRole() != null && "ADMIN".equals(u.getRole().name()))
				.findFirst();
		
		if (admin.isPresent()) {
			return admin.get().getId();
		}
		
		// Fallback: try to find by email pattern
		var adminByEmail = users.findAll().stream()
				.filter(u -> u.getEmail() != null && u.getEmail().toLowerCase().contains("admin"))
				.findFirst();
		
		return adminByEmail.map(trenvus.Exchange.user.UserEntity::getId).orElse(null);
	}

	public record WalletOperationResult(long usdCents, long trvCents, Long transactionId) {}

	public record ConvertResult(long usdCents, long trvCents, Long transactionId, long feeUsdCents) {}
}
