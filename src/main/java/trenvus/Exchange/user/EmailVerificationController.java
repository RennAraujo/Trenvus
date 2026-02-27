package trenvus.Exchange.user;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/email-verification")
@Validated
public class EmailVerificationController {

	private final EmailVerificationService verificationService;

	public EmailVerificationController(EmailVerificationService verificationService) {
		this.verificationService = verificationService;
	}

	@GetMapping("/verify")
	public ResponseEntity<VerifyResponse> verifyEmail(@RequestParam @NotBlank String token) {
		var result = verificationService.verifyToken(token);
		
		// Complete the email change if this was an email change verification
		if ("EMAIL_CHANGE".equals(result.tokenType())) {
			verificationService.completeEmailVerification(result.userId(), result.email());
		} else if ("REGISTRATION".equals(result.tokenType())) {
			// Mark user's email as verified for registration
			verificationService.markEmailAsVerified(result.userId());
		}
		
		return ResponseEntity.ok(new VerifyResponse(
			"Email verified successfully",
			result.email(),
			result.tokenType()
		));
	}

	@PostMapping("/resend")
	public ResponseEntity<ResendResponse> resendVerification(@Valid @RequestBody ResendRequest request) {
		// In a real implementation, you'd need to authenticate the user first
		// For now, this is a placeholder
		return ResponseEntity.ok(new ResendResponse("Verification email resent"));
	}

	public record VerifyResponse(String message, String email, String tokenType) {}

	public record ResendRequest(@NotBlank String email) {}

	public record ResendResponse(String message) {}
}
