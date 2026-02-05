package trenvus.Exchange.auth;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import trenvus.Exchange.user.UserEntity;
import trenvus.Exchange.user.UserRepository;
import trenvus.Exchange.wallet.WalletService;

@Component
public class TestAccountBootstrap implements ApplicationRunner {
	private final UserRepository users;
	private final PasswordEncoder passwordEncoder;
	private final WalletService walletService;
	private final TestAccountsConfig testAccounts;

	public TestAccountBootstrap(
			UserRepository users,
			PasswordEncoder passwordEncoder,
			WalletService walletService,
			TestAccountsConfig testAccounts
	) {
		this.users = users;
		this.passwordEncoder = passwordEncoder;
		this.walletService = walletService;
		this.testAccounts = testAccounts;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (!testAccounts.isEnabled()) {
			return;
		}

		for (var account : testAccounts.accounts()) {
			var user = users.findByEmail(account.email()).orElseGet(() -> {
				var created = new UserEntity();
				created.setEmail(account.email());
				return created;
			});

			user.setRole(account.role());
			user.setPasswordHash(passwordEncoder.encode(account.password()));
			user = users.save(user);

			walletService.ensureUserWallets(user.getId());
		}
	}
}
