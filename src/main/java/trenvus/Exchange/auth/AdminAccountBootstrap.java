package trenvus.Exchange.auth;

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
		adminAccount.validateOrThrow();
		if (!adminAccount.isEnabled()) {
			return;
		}

		var user = users.findByEmail(adminAccount.email()).orElseGet(() -> {
			var created = new UserEntity();
			created.setEmail(adminAccount.email());
			return created;
		});

		user.setRole(UserRole.ADMIN);
		user.setPasswordHash(passwordEncoder.encode(adminAccount.password()));
		user = users.save(user);
		walletService.ensureUserWallets(user.getId());
	}
}

