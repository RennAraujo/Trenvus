package trenvus.Exchange.user;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import trenvus.Exchange.email.EmailService;

@Service
public class EmailVerificationService {

	private static final Duration TOKEN_EXPIRY = Duration.ofHours(24);
	private static final SecureRandom RANDOM = new SecureRandom();

	private final EmailVerificationTokenRepository tokenRepository;
	private final UserRepository userRepository;
	private final EmailService emailService;

	public EmailVerificationService(
			EmailVerificationTokenRepository tokenRepository,
			UserRepository userRepository,
			EmailService emailService) {
		this.tokenRepository = tokenRepository;
		this.userRepository = userRepository;
		this.emailService = emailService;
	}

	@Transactional
	public String createVerificationToken(Long userId, String email, String tokenType) {
		// Delete any existing unverified tokens for this user/email/type
		tokenRepository.deleteByUserIdAndEmailAndTokenTypeAndVerifiedAtIsNull(userId, email, tokenType);

		// Create new token
		var token = new EmailVerificationToken();
		token.setUserId(userId);
		token.setEmail(email);
		token.setToken(generateSecureToken());
		token.setTokenType(tokenType);
		token.setExpiresAt(Instant.now().plus(TOKEN_EXPIRY));

		tokenRepository.save(token);

		// Send email
		emailService.sendVerificationEmail(email, token.getToken(), tokenType);

		return token.getToken();
	}

	@Transactional
	public VerificationResult verifyToken(String token) {
		var tokenEntity = tokenRepository.findByToken(token)
				.orElseThrow(() -> new IllegalArgumentException("Invalid or expired token"));

		if (tokenEntity.isExpired()) {
			throw new IllegalArgumentException("Token has expired");
		}

		if (tokenEntity.isVerified()) {
			throw new IllegalArgumentException("Token already used");
		}

		// Mark token as verified
		tokenEntity.setVerifiedAt(Instant.now());
		tokenRepository.save(tokenEntity);

		return new VerificationResult(
			tokenEntity.getUserId(),
			tokenEntity.getEmail(),
			tokenEntity.getTokenType()
		);
	}

	@Transactional
	public void completeEmailVerification(Long userId, String newEmail) {
		var user = userRepository.findById(userId)
				.orElseThrow(() -> new IllegalArgumentException("User not found"));

		String oldEmail = user.getEmail();
		user.setEmail(newEmail);
		userRepository.save(user);

		// Send notification to old email
		if (oldEmail != null && !oldEmail.equals(newEmail)) {
			emailService.sendEmailChangedNotification(oldEmail, newEmail);
		}
	}

	private String generateSecureToken() {
		byte[] bytes = new byte[32];
		RANDOM.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	@Transactional
	public void markEmailAsVerified(Long userId) {
		var user = userRepository.findById(userId)
				.orElseThrow(() -> new IllegalArgumentException("User not found"));
		user.setEmailVerified(true);
		userRepository.save(user);
		System.out.println("User email marked as verified: " + user.getEmail());
	}

	public record VerificationResult(Long userId, String email, String tokenType) {}
}
}
