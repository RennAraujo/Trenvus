package trenvus.Exchange.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/auth")
@Validated
public class AuthController {
	private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
	
	private final AuthService authService;
	private final TestAccountsConfig testAccounts;

	public AuthController(AuthService authService, TestAccountsConfig testAccounts) {
		this.authService = authService;
		this.testAccounts = testAccounts;
	}
	
	@GetMapping("/test-accounts-status")
	public ResponseEntity<Map<String, Object>> getTestAccountsStatus() {
		var accounts = testAccounts.accounts();
		var accountInfo = accounts.stream()
			.map(a -> Map.of("email", a.email(), "role", a.role().name()))
			.toList();
		
		return ResponseEntity.ok(Map.of(
			"enabled", testAccounts.isEnabled(),
			"count", accounts.size(),
			"accounts", accountInfo
		));
	}

	@PostMapping("/register")
	public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
		var result = authService.register(request.email(), request.password());
		return ResponseEntity.ok(AuthResponse.from(result));
	}

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
		var result = authService.login(request.email(), request.password());
		return ResponseEntity.ok(AuthResponse.from(result));
	}

	@PostMapping("/test-login")
	public ResponseEntity<AuthResponse> testLogin(@Valid @RequestBody TestLoginRequest request) {
		logger.info("Test login attempt for id: {}, test accounts enabled: {}", request.id(), testAccounts.isEnabled());
		
		if (!testAccounts.isEnabled()) {
			logger.warn("Test login rejected - test accounts are disabled");
			throw new ResponseStatusException(HttpStatus.NOT_FOUND);
		}
		TestAccountsConfig.TestAccount account;
		try {
			account = testAccounts.getById(request.id());
			logger.info("Test account found: {}", account.email());
		} catch (IllegalArgumentException ex) {
			logger.warn("Test account not found for id: {}", request.id());
			throw new ResponseStatusException(HttpStatus.NOT_FOUND);
		}
		var result = authService.login(account.email(), account.password());
		logger.info("Test login successful for: {}", account.email());
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

	public record RegisterRequest(@NotBlank @Email String email, @NotBlank String password) {}

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
