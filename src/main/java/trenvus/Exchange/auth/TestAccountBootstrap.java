package trenvus.Exchange.auth;

import org.springframework.beans.factory.annotation.Value;
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
public class TestAccountBootstrap implements ApplicationRunner {
	private final UserRepository users;
	private final PasswordEncoder passwordEncoder;
	private final WalletService walletService;
	private final boolean enabled;
	private final String email;
	private final String password;

	public TestAccountBootstrap(
			UserRepository users,
			PasswordEncoder passwordEncoder,
			WalletService walletService,
			@Value("${TEST_ACCOUNT_ENABLED:false}") boolean enabled,
			@Value("${TEST_ACCOUNT_EMAIL:user@test.com}") String email,
			@Value("${TEST_ACCOUNT_PASSWORD:123}") String password
	) {
		this.users = users;
		this.passwordEncoder = passwordEncoder;
		this.walletService = walletService;
		this.enabled = enabled;
		this.email = email;
		this.password = password;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (!enabled) {
			return;
		}

		var user = users.findByEmail(email).orElseGet(() -> {
			var created = new UserEntity();
			created.setEmail(email);
			return created;
		});

		user.setRole(UserRole.ADMIN);
		user.setPasswordHash(passwordEncoder.encode(password));
		user = users.save(user);

		walletService.ensureUserWallets(user.getId());
	}
}

