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

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ExchangeServiceTests {
	@Autowired
	private ExchangeService exchangeService;

	@Autowired
	private WalletService walletService;

	@Autowired
	private UserRepository users;

	@Test
	void convertUsdToVps_appliesFixedFeeAndKeepsOneToOneRate() {
		var userId = createUser("user1@trenvus.local");
		walletService.ensureUserWallets(userId);

		exchangeService.depositUsd(userId, 2_000);
		var result = exchangeService.convertUsdToVps(userId, 1_000, "k1");

		assertEquals(950, result.usdCents());
		assertEquals(1_000, result.vpsCents());
		assertEquals(ExchangeService.CONVERSION_FEE_USD_CENTS, result.feeUsdCents());
		assertNotNull(result.transactionId());
	}

	@Test
	void convertUsdToVps_isIdempotentWithSameKey() {
		var userId = createUser("user2@trenvus.local");
		walletService.ensureUserWallets(userId);

		exchangeService.depositUsd(userId, 2_000);
		var first = exchangeService.convertUsdToVps(userId, 1_000, "k1");
		var second = exchangeService.convertUsdToVps(userId, 1_000, "k1");

		assertEquals(first.usdCents(), second.usdCents());
		assertEquals(first.vpsCents(), second.vpsCents());
		assertEquals(first.transactionId(), second.transactionId());
	}

	@Test
	void convertUsdToVps_rejectsInsufficientBalance() {
		var userId = createUser("user3@trenvus.local");
		walletService.ensureUserWallets(userId);

		exchangeService.depositUsd(userId, 1_000);
		var ex = assertThrows(IllegalArgumentException.class, () -> exchangeService.convertUsdToVps(userId, 1_000, "k1"));
		assertTrue(ex.getMessage().toLowerCase().contains("saldo"));
	}

	@Test
	void convertVpsToUsd_appliesFixedFeeAndKeepsOneToOneRate() {
		var userId = createUser("user4@trenvus.local");
		walletService.ensureUserWallets(userId);

		exchangeService.depositUsd(userId, 2_000);
		exchangeService.convertUsdToVps(userId, 1_000, "k1");
		var result = exchangeService.convertVpsToUsd(userId, 1_000, "k2");

		assertEquals(1_900, result.usdCents());
		assertEquals(0, result.vpsCents());
		assertEquals(ExchangeService.CONVERSION_FEE_USD_CENTS, result.feeUsdCents());
		assertNotNull(result.transactionId());
	}

	@Test
	void convertVpsToUsd_isIdempotentWithSameKey() {
		var userId = createUser("user5@trenvus.local");
		walletService.ensureUserWallets(userId);

		exchangeService.depositUsd(userId, 2_000);
		exchangeService.convertUsdToVps(userId, 1_000, "k1");
		var first = exchangeService.convertVpsToUsd(userId, 1_000, "k2");
		var second = exchangeService.convertVpsToUsd(userId, 1_000, "k2");

		assertEquals(first.usdCents(), second.usdCents());
		assertEquals(first.vpsCents(), second.vpsCents());
		assertEquals(first.transactionId(), second.transactionId());
	}

	@Test
	void convertVpsToUsd_rejectsAmountNotCoveringFee() {
		var userId = createUser("user6@trenvus.local");
		walletService.ensureUserWallets(userId);

		exchangeService.depositUsd(userId, 2_000);
		exchangeService.convertUsdToVps(userId, 1_000, "k1");
		var ex = assertThrows(IllegalArgumentException.class, () -> exchangeService.convertVpsToUsd(userId, 50, "k2"));
		assertTrue(ex.getMessage().toLowerCase().contains("taxa"));
	}

	@Test
	void convertVpsToUsd_rejectsInsufficientBalance() {
		var userId = createUser("user7@trenvus.local");
		walletService.ensureUserWallets(userId);

		exchangeService.depositUsd(userId, 100);
		exchangeService.convertUsdToVps(userId, 50, "k1");
		var ex = assertThrows(IllegalArgumentException.class, () -> exchangeService.convertVpsToUsd(userId, 100, "k2"));
		assertTrue(ex.getMessage().toLowerCase().contains("saldo"));
	}

	private Long createUser(String email) {
		var user = new UserEntity();
		user.setEmail(email);
		user.setPasswordHash("test");
		return users.save(user).getId();
	}
}
