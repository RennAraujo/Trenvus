package trenvus.Exchange.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
	private static final Logger logger = LoggerFactory.getLogger(TestAccountBootstrap.class);
	
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
		logger.info("TestAccountBootstrap running. Enabled: {}", testAccounts.isEnabled());
		
		if (!testAccounts.isEnabled()) {
			logger.info("Test accounts are disabled.");
			return;
		}

		var accounts = testAccounts.accounts();
		logger.info("Creating {} test accounts...", accounts.size());

		for (var account : accounts) {
			logger.info("Processing test account: {} (role: {})", account.email(), account.role());
			
			var user = users.findByEmail(account.email()).orElseGet(() -> {
				logger.info("Creating new test account: {}", account.email());
				var created = new UserEntity();
				created.setEmail(account.email());
				return created;
			});

			user.setRole(account.role());
			user.setPasswordHash(passwordEncoder.encode(account.password()));
			user = users.save(user);
			logger.info("Test account saved: {} (id: {})", account.email(), user.getId());

			walletService.ensureUserWallets(user.getId());
			logger.info("Wallets ensured for: {}", account.email());
		}
		
		logger.info("Test accounts bootstrap completed.");
	}
}
