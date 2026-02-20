package trenvus.Exchange.transfer;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import trenvus.Exchange.exchange.ExchangeService;
import trenvus.Exchange.user.UserEntity;
import trenvus.Exchange.user.UserRepository;
import trenvus.Exchange.wallet.WalletService;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TransferServiceTests {
	@Autowired
	private TransferService transferService;

	@Autowired
	private ExchangeService exchangeService;

	@Autowired
	private WalletService walletService;

	@Autowired
	private UserRepository users;

	@Test
	void transferTrv_movesBalanceWithoutFee() {
		var fromUserId = createUser("from@trenvus.local");
		var toUserId = createUser("to@trenvus.local");

		walletService.ensureUserWallets(fromUserId);
		walletService.ensureUserWallets(toUserId);

		exchangeService.depositUsd(fromUserId, 5_000);
		exchangeService.convertUsdToTrv(fromUserId, 2_000, "k1");

		var result = transferService.transferTrv(fromUserId, "to@trenvus.local", 1_000);
		assertEquals(0, result.feeTrvCents());

		var fromSnapshot = walletService.getSnapshot(fromUserId);
		var toSnapshot = walletService.getSnapshot(toUserId);

		assertEquals(fromSnapshot.trvCents(), result.trvCents());
		assertEquals(1_000, fromSnapshot.trvCents());
		assertEquals(1_000, toSnapshot.trvCents());
	}

	@Test
	void transferTrv_rejectsSelfTransfer() {
		var userId = createUser("self@trenvus.local");
		walletService.ensureUserWallets(userId);
		exchangeService.depositUsd(userId, 2_000);
		exchangeService.convertUsdToTrv(userId, 1_000, "k1");

		var ex = assertThrows(IllegalArgumentException.class, () -> transferService.transferTrv(userId, "self@trenvus.local", 100));
		assertTrue(ex.getMessage().toLowerCase().contains("si mesmo"));
	}

	private Long createUser(String email) {
		var user = new UserEntity();
		user.setEmail(email);
		user.setPasswordHash("test");
		return users.save(user).getId();
	}
}
