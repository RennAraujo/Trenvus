package trenvus.Exchange.user;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
public class UserController {
	private final UserRepository users;

	public UserController(UserRepository users) {
		this.users = users;
	}

	@GetMapping("/lookup")
	public ResponseEntity<UserLookupResponse> lookupUser(
			@AuthenticationPrincipal Jwt jwt,
			@RequestParam String identifier
	) {
		if (identifier == null || identifier.isBlank()) {
			throw new IllegalArgumentException("Identifier is required");
		}

		var trimmed = identifier.trim();
		var user = users.findByEmail(trimmed)
				.or(() -> users.findByNickname(trimmed))
				.or(() -> users.findByTec(trimmed))
				.orElseThrow(() -> new IllegalArgumentException("User not found"));

		return ResponseEntity.ok(new UserLookupResponse(
			user.getId(),
			user.getEmail(),
			user.getNickname() != null ? user.getNickname() : user.getEmail(),
			user.getTec() != null ? user.getTec() : "TEC-" + String.format("%010d", user.getId())
		));
	}

	public record UserLookupResponse(Long id, String email, String nickname, String tec) {}
}
