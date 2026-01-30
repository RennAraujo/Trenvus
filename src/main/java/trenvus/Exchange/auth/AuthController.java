package trenvus.Exchange.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@Validated
public class AuthController {
	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
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

	public record RefreshRequest(@NotBlank String refreshToken) {}

	public record LogoutRequest(@NotBlank String refreshToken) {}

	public record AuthResponse(String accessToken, Instant accessExpiresAt, String refreshToken, String tokenType) {
		static AuthResponse from(AuthService.AuthResult result) {
			return new AuthResponse(result.accessToken(), result.accessExpiresAt(), result.refreshToken(), "Bearer");
		}
	}
}

