package trenvus.Exchange.exchange;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import trenvus.Exchange.user.UserEntity;
import trenvus.Exchange.user.UserRepository;
import trenvus.Exchange.wallet.WalletService;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
		"ADMIN_ACCOUNT_ENABLED=true",
		"ADMIN_LOGIN_ENABLED=false",
		"ADMIN_EMAIL=admin@trenvus.local",
		"ADMIN_PASSWORD=test-admin-password"
})
@ActiveProfiles("test")
@Transactional
class FeeRecipientTests {
	@Autowired
	private ExchangeService exchangeService;

	@Autowired
	private WalletService walletService;

	@Autowired
	private UserRepository users;

	@Test
	void convertUsdToTrv_creditsFeeToAdminUsdWallet() {
		var adminId = users.findByEmail("admin@trenvus.local").orElseThrow().getId();
		walletService.ensureUserWallets(adminId);
		var adminBefore = walletService.getSnapshot(adminId);

		var userId = createUser("user-fee-1@trenvus.local");
		walletService.ensureUserWallets(userId);
		exchangeService.depositUsd(userId, 2_000);

		exchangeService.convertUsdToTrv(userId, 1_000, "k1");

		var adminAfter = walletService.getSnapshot(adminId);
		assertEquals(adminBefore.usdCents() + 10, adminAfter.usdCents());
	}

	@Test
	void convertTrvToUsd_creditsFeeToAdminUsdWallet() {
		var adminId = users.findByEmail("admin@trenvus.local").orElseThrow().getId();
		walletService.ensureUserWallets(adminId);
		var adminBefore = walletService.getSnapshot(adminId);

		var userId = createUser("user-fee-2@trenvus.local");
		walletService.ensureUserWallets(userId);
		exchangeService.depositUsd(userId, 2_000);
		exchangeService.convertUsdToTrv(userId, 1_000, "k1");

		exchangeService.convertTrvToUsd(userId, 1_000, "k2");

		var adminAfter = walletService.getSnapshot(adminId);
		assertEquals(adminBefore.usdCents() + 20, adminAfter.usdCents());
	}

	private Long createUser(String email) {
		var user = new UserEntity();
		user.setEmail(email);
		user.setPasswordHash("test");
		return users.save(user).getId();
	}
}
