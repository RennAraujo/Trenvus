package trenvus.Exchange.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/auth")
@Validated
public class AuthController {
	private final AuthService authService;
	private final TestAccountsConfig testAccounts;
	private final AdminAccountConfig adminAccount;

	public AuthController(AuthService authService, TestAccountsConfig testAccounts, AdminAccountConfig adminAccount) {
		this.authService = authService;
		this.testAccounts = testAccounts;
		this.adminAccount = adminAccount;
	}

	@PostMapping("/register")
	public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
		var result = authService.register(request.email(), request.password(), request.nickname(), request.phone());
		return ResponseEntity.ok(AuthResponse.from(result));
	}

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
		var result = authService.login(request.email(), request.password());
		return ResponseEntity.ok(AuthResponse.from(result));
	}

	@PostMapping("/test-login")
	public ResponseEntity<AuthResponse> testLogin(@Valid @RequestBody TestLoginRequest request) {
		if (!testAccounts.isEnabled()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND);
		}
		TestAccountsConfig.TestAccount account;
		try {
			account = testAccounts.getById(request.id());
		} catch (IllegalArgumentException ex) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND);
		}
		var result = authService.login(account.email(), account.password());
		return ResponseEntity.ok(AuthResponse.from(result));
	}

	@PostMapping("/admin-login")
	public ResponseEntity<AuthResponse> adminLogin() {
		if (!adminAccount.isEnabled()) {
			throw new IllegalArgumentException("admin_account_disabled");
		}
		if (!adminAccount.isLoginEnabled()) {
			throw new IllegalArgumentException("admin_login_disabled");
		}
		var result = authService.login(adminAccount.email(), adminAccount.password());
		return ResponseEntity.ok(AuthResponse.from(result));
	}

	@PostMapping("/refresh")
	public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
		var result = authService.refresh(request.refreshToken());
		return ResponseEntity.ok(AuthResponse.from(result));
	}

	@PostMapping("/logout")
	public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest request) {
		authService.logout(request.refreshToken());
		return ResponseEntity.noContent().build();
	}

	public record RegisterRequest(
			@NotBlank @Email String email,
			@NotBlank String password,
			@NotBlank String nickname,
			@NotBlank String phone
	) {}

	public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

	public record TestLoginRequest(@Min(1) int id) {}

	public record RefreshRequest(@NotBlank String refreshToken) {}

	public record LogoutRequest(@NotBlank String refreshToken) {}

	public record AuthResponse(String accessToken, Instant accessExpiresAt, String refreshToken, String tokenType) {
		static AuthResponse from(AuthService.AuthResult result) {
			return new AuthResponse(result.accessToken(), result.accessExpiresAt(), result.refreshToken(), "Bearer");
		}
	}
}
