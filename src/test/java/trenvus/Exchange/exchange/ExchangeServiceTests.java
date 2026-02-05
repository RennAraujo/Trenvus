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
	void depositUsd_rejectsAmountBelowMinimum() {
		var userId = createUser("user0@trenvus.local");
		walletService.ensureUserWallets(userId);

		var ex = assertThrows(IllegalArgumentException.class, () -> exchangeService.depositUsd(userId, 999));
		assertTrue(ex.getMessage().toLowerCase().contains("deposit_minimum"));
	}

	@Test
	void convertUsdToTrv_appliesOnePercentFeeAndKeepsOneToOneRate() {
		var userId = createUser("user1@trenvus.local");
		walletService.ensureUserWallets(userId);

		exchangeService.depositUsd(userId, 2_000);
		var result = exchangeService.convertUsdToTrv(userId, 1_000, "k1");

		assertEquals(990, result.usdCents());
		assertEquals(1_000, result.trvCents());
		assertEquals(10, result.feeUsdCents());
		assertNotNull(result.transactionId());
	}

	@Test
	void convertUsdToTrv_isIdempotentWithSameKey() {
		var userId = createUser("user2@trenvus.local");
		walletService.ensureUserWallets(userId);

		exchangeService.depositUsd(userId, 2_000);
		var first = exchangeService.convertUsdToTrv(userId, 1_000, "k1");
		var second = exchangeService.convertUsdToTrv(userId, 1_000, "k1");

		assertEquals(first.usdCents(), second.usdCents());
		assertEquals(first.trvCents(), second.trvCents());
		assertEquals(first.transactionId(), second.transactionId());
	}

	@Test
	void convertUsdToTrv_rejectsInsufficientBalance() {
		var userId = createUser("user3@trenvus.local");
		walletService.ensureUserWallets(userId);

		exchangeService.depositUsd(userId, 1_000);
		var ex = assertThrows(IllegalArgumentException.class, () -> exchangeService.convertUsdToTrv(userId, 1_000, "k1"));
		assertTrue(ex.getMessage().toLowerCase().contains("saldo"));
	}

	@Test
	void convertTrvToUsd_appliesOnePercentFeeAndKeepsOneToOneRate() {
		var userId = createUser("user4@trenvus.local");
		walletService.ensureUserWallets(userId);

		exchangeService.depositUsd(userId, 2_000);
		exchangeService.convertUsdToTrv(userId, 1_000, "k1");
		var result = exchangeService.convertTrvToUsd(userId, 1_000, "k2");

		assertEquals(1_980, result.usdCents());
		assertEquals(0, result.trvCents());
		assertEquals(10, result.feeUsdCents());
		assertNotNull(result.transactionId());
	}

	@Test
	void convertTrvToUsd_isIdempotentWithSameKey() {
		var userId = createUser("user5@trenvus.local");
		walletService.ensureUserWallets(userId);

		exchangeService.depositUsd(userId, 2_000);
		exchangeService.convertUsdToTrv(userId, 1_000, "k1");
		var first = exchangeService.convertTrvToUsd(userId, 1_000, "k2");
		var second = exchangeService.convertTrvToUsd(userId, 1_000, "k2");

		assertEquals(first.usdCents(), second.usdCents());
		assertEquals(first.trvCents(), second.trvCents());
		assertEquals(first.transactionId(), second.transactionId());
	}

	@Test
	void convertTrvToUsd_rejectsAmountBelowMinimum() {
		var userId = createUser("user6@trenvus.local");
		walletService.ensureUserWallets(userId);

		exchangeService.depositUsd(userId, 2_000);
		exchangeService.convertUsdToTrv(userId, 1_000, "k1");
		var ex = assertThrows(IllegalArgumentException.class, () -> exchangeService.convertTrvToUsd(userId, 50, "k2"));
		assertTrue(ex.getMessage().toLowerCase().contains("mínimo") || ex.getMessage().toLowerCase().contains("minimo"));
	}

	@Test
	void convertTrvToUsd_rejectsInsufficientBalance() {
		var userId = createUser("user7@trenvus.local");
		walletService.ensureUserWallets(userId);

		exchangeService.depositUsd(userId, 2_000);
		exchangeService.convertUsdToTrv(userId, 100, "k1");
		var ex = assertThrows(IllegalArgumentException.class, () -> exchangeService.convertTrvToUsd(userId, 200, "k2"));
		assertTrue(ex.getMessage().toLowerCase().contains("saldo"));
	}

	private Long createUser(String email) {
		var user = new UserEntity();
		user.setEmail(email);
		user.setPasswordHash("test");
		return users.save(user).getId();
	}
}
