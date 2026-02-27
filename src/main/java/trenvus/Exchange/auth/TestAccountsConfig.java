package trenvus.Exchange.auth;

import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import trenvus.Exchange.user.UserRole;

@Component
public class TestAccountsConfig {
	private final boolean enabled;
	private final String accountsRaw;
	private final String legacyEmail;
	private final String legacyPassword;

	public TestAccountsConfig(
			@Value("${TEST_ACCOUNT_ENABLED:false}") boolean enabled,
			@Value("${TEST_ACCOUNTS:}") String accountsRaw,
			@Value("${TEST_ACCOUNT_EMAIL:user@test.com}") String legacyEmail,
			@Value("${TEST_ACCOUNT_PASSWORD:123}") String legacyPassword
	) {
		this.enabled = enabled;
		this.accountsRaw = accountsRaw == null ? "" : accountsRaw.trim();
		this.legacyEmail = legacyEmail == null ? "" : legacyEmail.trim();
		this.legacyPassword = legacyPassword == null ? "" : legacyPassword;
	}

	public boolean isEnabled() {
		return enabled;
	}

	public List<TestAccount> accounts() {
		if (!enabled) {
			return List.of();
		}
		if (!accountsRaw.isBlank()) {
			var parsed = parseAccounts(accountsRaw);
			return parsed.isEmpty() ? defaultAccounts() : List.copyOf(parsed);
		}
		return defaultAccounts();
	}

	public TestAccount getById(int id) {
		var list = accounts();
		if (id < 1 || id > list.size()) {
			throw new IllegalArgumentException("invalid_test_account_id");
		}
		return list.get(id - 1);
	}

	private List<TestAccount> defaultAccounts() {
		var password = legacyPassword == null || legacyPassword.isBlank() ? "123" : legacyPassword;
		var email1 = legacyEmail == null || legacyEmail.isBlank() ? "user1@test.com" : legacyEmail;
		return List.of(
				new TestAccount(email1, password, UserRole.USER),
				new TestAccount("user2@test.com", password, UserRole.USER),
				new TestAccount("user3@test.com", password, UserRole.USER)
		);
	}

	private static List<TestAccount> parseAccounts(String raw) {
		var out = new ArrayList<TestAccount>();
		for (var entry : raw.split(";")) {
			var trimmed = entry == null ? "" : entry.trim();
			if (trimmed.isBlank()) continue;

			var parts = trimmed.split(":");
			if (parts.length < 2) continue;

			var email = parts[0] == null ? "" : parts[0].trim();
			var password = parts[1] == null ? "" : parts[1];
			if (email.isBlank() || password.isBlank()) continue;

			var role = UserRole.USER;
			if (parts.length >= 3) {
				var rawRole = parts[2] == null ? "" : parts[2].trim();
				if (!rawRole.isBlank()) {
					try {
						role = UserRole.valueOf(rawRole);
					} catch (IllegalArgumentException ignored) {
						role = UserRole.USER;
					}
				}
			}

			out.add(new TestAccount(email, password, role));
		}
		return out;
	}

	public record TestAccount(String email, String password, UserRole role) {}
}
