package trenvus.Exchange.wallet;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WalletService {
	private final WalletRepository wallets;

	public WalletService(WalletRepository wallets) {
		this.wallets = wallets;
	}

	@Transactional
	public void ensureUserWallets(Long userId) {
		getOrCreate(userId, Currency.USD);
		getOrCreate(userId, Currency.VPS);
	}

	@Transactional
	public WalletSnapshot getSnapshot(Long userId) {
		ensureUserWallets(userId);
		var list = wallets.findByUserId(userId);
		long usd = list.stream().filter(w -> w.getCurrency() == Currency.USD).findFirst().map(WalletEntity::getBalanceCents).orElse(0L);
		long vps = list.stream().filter(w -> w.getCurrency() == Currency.VPS).findFirst().map(WalletEntity::getBalanceCents).orElse(0L);
		return new WalletSnapshot(usd, vps);
	}

	private WalletEntity getOrCreate(Long userId, Currency currency) {
		var existing = wallets.findByUserIdAndCurrency(userId, currency);
		if (existing.isPresent()) {
			return existing.get();
		}

		try {
			var wallet = new WalletEntity();
			wallet.setUserId(userId);
			wallet.setCurrency(currency);
			wallet.setBalanceCents(0L);
			return wallets.save(wallet);
		} catch (DataIntegrityViolationException ignored) {
			return wallets.findByUserIdAndCurrency(userId, currency).orElseThrow();
		}
	}

	public record WalletSnapshot(long usdCents, long vpsCents) {}
}

