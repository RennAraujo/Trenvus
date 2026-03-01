package trenvus.Exchange.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import trenvus.Exchange.email.EmailService;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

@Service
public class ConfirmationService {
    private static final Logger logger = LoggerFactory.getLogger(ConfirmationService.class);
    private static final Duration REGISTRATION_TOKEN_EXPIRY = Duration.ofHours(24);
    private static final Duration DELETION_TOKEN_EXPIRY = Duration.ofHours(1);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ConfirmationTokenRepository tokenRepository;
    private final EmailService emailService;

    public ConfirmationService(ConfirmationTokenRepository tokenRepository, EmailService emailService) {
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
    }

    @Transactional
    public String createRegistrationConfirmation(Long userId, String email) {
        logger.info("Creating registration confirmation token for user: {}", email);
        
        // Delete any existing tokens for this user
        tokenRepository.deleteByUserIdAndTokenType(userId, "REGISTRATION_CONFIRMATION");

        // Create new token
        ConfirmationToken token = new ConfirmationToken();
        token.setUserId(userId);
        token.setEmail(email);
        token.setToken(generateSecureToken());
        token.setTokenType("REGISTRATION_CONFIRMATION");
        token.setExpiresAt(Instant.now().plus(REGISTRATION_TOKEN_EXPIRY));

        tokenRepository.save(token);

        // Send email
        try {
            emailService.sendRegistrationConfirmation(email, token.getToken());
            logger.info("Registration confirmation email sent to: {}", email);
        } catch (Exception e) {
            logger.error("Failed to send registration confirmation email to {}: {}", email, e.getMessage());
            throw new RuntimeException("Failed to send confirmation email", e);
        }

        return token.getToken();
    }

    @Transactional
    public String createDeletionConfirmation(Long userId, String email) {
        logger.info("Creating deletion confirmation token for user: {}", email);
        
        // Delete any existing tokens for this user
        tokenRepository.deleteByUserIdAndTokenType(userId, "ACCOUNT_DELETION");

        // Create new token
        ConfirmationToken token = new ConfirmationToken();
        token.setUserId(userId);
        token.setEmail(email);
        token.setToken(generateSecureToken());
        token.setTokenType("ACCOUNT_DELETION");
        token.setExpiresAt(Instant.now().plus(DELETION_TOKEN_EXPIRY));

        tokenRepository.save(token);

        // Send email
        try {
            emailService.sendAccountDeletionConfirmation(email, token.getToken());
            logger.info("Deletion confirmation email sent to: {}", email);
        } catch (Exception e) {
            logger.error("Failed to send deletion confirmation email to {}: {}", email, e.getMessage());
            throw new RuntimeException("Failed to send confirmation email", e);
        }

        return token.getToken();
    }

    @Transactional
    public ConfirmationResult verifyRegistrationToken(String token) {
        logger.info("Verifying registration token");
        
        ConfirmationToken tokenEntity = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token"));

        if (!tokenEntity.getTokenType().equals("REGISTRATION_CONFIRMATION")) {
            throw new IllegalArgumentException("Invalid token type");
        }

        if (tokenEntity.isExpired()) {
            throw new IllegalArgumentException("Token has expired");
        }

        if (tokenEntity.isUsed()) {
            throw new IllegalArgumentException("Token has already been used");
        }

        // Mark token as used
        tokenEntity.setUsedAt(Instant.now());
        tokenRepository.save(tokenEntity);

        logger.info("Registration token verified for user: {}", tokenEntity.getUserId());
        return new ConfirmationResult(tokenEntity.getUserId(), tokenEntity.getEmail());
    }

    @Transactional
    public ConfirmationResult verifyDeletionToken(String token) {
        logger.info("Verifying deletion token");
        
        ConfirmationToken tokenEntity = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token"));

        if (!tokenEntity.getTokenType().equals("ACCOUNT_DELETION")) {
            throw new IllegalArgumentException("Invalid token type");
        }

        if (tokenEntity.isExpired()) {
            throw new IllegalArgumentException("Token has expired");
        }

        if (tokenEntity.isUsed()) {
            throw new IllegalArgumentException("Token has already been used");
        }

        // Mark token as used
        tokenEntity.setUsedAt(Instant.now());
        tokenRepository.save(tokenEntity);

        logger.info("Deletion token verified for user: {}", tokenEntity.getUserId());
        return new ConfirmationResult(tokenEntity.getUserId(), tokenEntity.getEmail());
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public record ConfirmationResult(Long userId, String email) {}
}
