package trenvus.Exchange.user;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/me")
@Validated
public class MeController {
	private final UserRepository users;
	private final PasswordEncoder passwordEncoder;

	public MeController(UserRepository users, PasswordEncoder passwordEncoder) {
		this.users = users;
		this.passwordEncoder = passwordEncoder;
	}

	@GetMapping
	public ResponseEntity<MeResponse> getMe(@AuthenticationPrincipal Jwt jwt) {
		Long userId = Long.valueOf(jwt.getSubject());
		var user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
		return ResponseEntity.ok(new MeResponse(user.getEmail(), user.getNickname(), user.getPhone()));
	}

	@PutMapping("/phone")
	public ResponseEntity<MeResponse> updatePhone(@Valid @RequestBody UpdatePhoneRequest request, @AuthenticationPrincipal Jwt jwt) {
		Long userId = Long.valueOf(jwt.getSubject());
		var user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
		user.setPhone(request.phone().trim());
		user = users.save(user);
		return ResponseEntity.ok(new MeResponse(user.getEmail(), user.getNickname(), user.getPhone()));
	}

	@PutMapping("/password")
	public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request, @AuthenticationPrincipal Jwt jwt) {
		Long userId = Long.valueOf(jwt.getSubject());
		var user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

		if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
			throw new IllegalArgumentException("Senha atual incorreta");
		}
		user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
		users.save(user);
		return ResponseEntity.noContent().build();
	}

	public record UpdatePhoneRequest(@NotBlank String phone) {}

	public record ChangePasswordRequest(@NotBlank String currentPassword, @NotBlank @Size(min = 6) String newPassword) {}

	public record MeResponse(String email, String nickname, String phone) {}
}

