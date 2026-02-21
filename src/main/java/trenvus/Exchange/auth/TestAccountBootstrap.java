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
		logger.info("========================================");
		logger.info("TestAccountBootstrap STARTING");
		logger.info("Enabled: {}", testAccounts.isEnabled());
		
		if (!testAccounts.isEnabled()) {
			logger.info("Test accounts are DISABLED - skipping");
			return;
		}

		var accounts = testAccounts.accounts();
		logger.info("Found {} test accounts to create/update", accounts.size());

		for (var account : accounts) {
			logger.info("----------------------------------------");
			logger.info("Processing: {} (role: {})", account.email(), account.role());
			
			try {
				var existingUser = users.findByEmail(account.email());
				UserEntity user;
				
				if (existingUser.isPresent()) {
					user = existingUser.get();
					logger.info("  -> Existing user found (id: {}, current role: {}, has password: {})", 
						user.getId(), user.getRole(), user.getPasswordHash() != null);
				} else {
					logger.info("  -> Creating NEW user");
					user = new UserEntity();
					user.setEmail(account.email());
				}

				user.setRole(account.role());
				var encodedPassword = passwordEncoder.encode(account.password());
				user.setPasswordHash(encodedPassword);
				logger.info("  -> Password encoded (length: {})", encodedPassword.length());
				
				user = users.save(user);
				logger.info("  -> User SAVED (id: {}, passwordHash is null: {})", 
					user.getId(), user.getPasswordHash() == null);

				walletService.ensureUserWallets(user.getId());
				logger.info("  -> Wallets ensured");
				
			} catch (Exception e) {
				logger.error("  -> FAILED to process {}: {}", account.email(), e.getMessage(), e);
			}
		}
		
		logger.info("========================================");
		logger.info("TestAccountBootstrap COMPLETED");
		
		// Verify accounts were created
		logger.info("Verifying test accounts in database:");
		for (var account : accounts) {
			var found = users.findByEmail(account.email());
			if (found.isPresent()) {
				var u = found.get();
				logger.info("  ✓ {} (id: {}, has password: {})", 
					u.getEmail(), u.getId(), u.getPasswordHash() != null);
			} else {
				logger.warn("  ✗ {} NOT FOUND", account.email());
			}
		}
	}
}
