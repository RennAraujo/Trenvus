package trenvus.Exchange.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AdminAccountConfig {
	private final boolean enabled;
	private final boolean loginEnabled;
	private final String email;
	private final String password;

	public AdminAccountConfig(
			@Value("${ADMIN_ACCOUNT_ENABLED:false}") boolean enabled,
			@Value("${ADMIN_LOGIN_ENABLED:true}") boolean loginEnabled,
			@Value("${ADMIN_EMAIL:}") String email,
			@Value("${ADMIN_PASSWORD:}") String password
	) {
		this.enabled = enabled;
		this.loginEnabled = loginEnabled;
		this.email = email == null ? "" : email.trim();
		this.password = password == null ? "" : password;
	}

	public boolean isEnabled() {
		return enabled || (!email.isBlank() && !password.isBlank());
	}

	public boolean isLoginEnabled() {
		return isEnabled() && loginEnabled;
	}

	public String email() {
		return email;
	}

	public String password() {
		return password;
	}

	public void validateOrThrow() {
		if (!isEnabled()) {
			return;
		}
		if (email.isBlank() || password.isBlank()) {
			throw new IllegalStateException("admin_account_enabled_but_missing_credentials");
		}
	}
}
