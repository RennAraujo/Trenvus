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
import trenvus.Exchange.user.UserRole;
import trenvus.Exchange.wallet.WalletService;

@Component
public class AdminAccountBootstrap implements ApplicationRunner {
	private static final Logger logger = LoggerFactory.getLogger(AdminAccountBootstrap.class);
	
	private final UserRepository users;
	private final PasswordEncoder passwordEncoder;
	private final WalletService walletService;
	private final AdminAccountConfig adminAccount;

	public AdminAccountBootstrap(
			UserRepository users,
			PasswordEncoder passwordEncoder,
			WalletService walletService,
			AdminAccountConfig adminAccount
	) {
		this.users = users;
		this.passwordEncoder = passwordEncoder;
		this.walletService = walletService;
		this.adminAccount = adminAccount;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		logger.info("========================================");
		logger.info("AdminAccountBootstrap STARTING");
		
		try {
			adminAccount.validateOrThrow();
		} catch (Exception e) {
			logger.error("Admin account validation failed: {}", e.getMessage());
			return;
		}
		
		logger.info("Admin account enabled: {}", adminAccount.isEnabled());
		logger.info("Admin login enabled: {}", adminAccount.isLoginEnabled());
		
		if (!adminAccount.isEnabled()) {
			logger.info("Admin account is DISABLED - skipping");
			return;
		}

		logger.info("Admin email: {}", adminAccount.email());
		
		var user = users.findByEmail(adminAccount.email()).orElseGet(() -> {
			logger.info("Creating NEW admin user");
			var created = new UserEntity();
			created.setEmail(adminAccount.email());
			return created;
		});

		user.setNickname("Administrador");
		if (user.getPhone() == null || user.getPhone().isBlank()) {
			user.setPhone("0000000000");
		}
		user.setRole(UserRole.ADMIN);
		var encodedPassword = passwordEncoder.encode(adminAccount.password());
		user.setPasswordHash(encodedPassword);
		user = users.save(user);
		
		logger.info("Admin user SAVED (id: {}, has password: {})", user.getId(), user.getPasswordHash() != null);
		
		walletService.ensureUserWallets(user.getId());
		logger.info("Admin wallets ensured");
		logger.info("========================================");
	}
}
