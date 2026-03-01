package trenvus.Exchange.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import trenvus.Exchange.email.EmailService;
import trenvus.Exchange.wallet.WalletService;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

@Service
public class RegistrationService {
    private static final Logger logger = LoggerFactory.getLogger(RegistrationService.class);
    private static final Duration TOKEN_EXPIRY = Duration.ofHours(24);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final PendingRegistrationRepository pendingRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final WalletService walletService;

    public RegistrationService(
            PendingRegistrationRepository pendingRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            WalletService walletService) {
        this.pendingRepository = pendingRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.walletService = walletService;
    }

    @Transactional
    public void initiateRegistration(String email, String password, String nickname, String phone) {
        logger.info("Initiating registration for: {}", email);
        
        // Verifica se o email já existe
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Remove qualquer registro pendente existente para este email
        pendingRepository.findByEmail(email).ifPresent(pendingRepository::delete);

        // Cria novo registro pendente
        PendingRegistration pending = new PendingRegistration();
        pending.setEmail(email);
        pending.setPasswordHash(passwordEncoder.encode(password));
        
        if (nickname != null && !nickname.isBlank()) {
            pending.setNickname(nickname.trim());
        }
        if (phone != null && !phone.isBlank()) {
            pending.setPhone(phone.trim());
        }
        
        pending.setToken(generateSecureToken());
        pending.setExpiresAt(Instant.now().plus(TOKEN_EXPIRY));
        
        pendingRepository.save(pending);
        
        logger.info("Pending registration created for: {}", email);

        // Envia email de confirmação
        try {
            emailService.sendRegistrationConfirmation(email, pending.getToken());
            logger.info("Confirmation email sent to: {}", email);
        } catch (Exception e) {
            logger.error("Failed to send confirmation email to {}: {}", email, e.getMessage());
            throw new RuntimeException("Failed to send confirmation email", e);
        }
    }

    @Transactional
    public RegistrationResult confirmRegistration(String token) {
        logger.info("Confirming registration with token");
        
        PendingRegistration pending = pendingRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token"));

        if (pending.isExpired()) {
            pendingRepository.delete(pending);
            throw new IllegalArgumentException("Token has expired. Please register again.");
        }

        // Verifica novamente se o email já existe (pode ter sido criado por outro meio)
        if (userRepository.existsByEmail(pending.getEmail())) {
            pendingRepository.delete(pending);
            throw new IllegalArgumentException("Email already registered");
        }

        // Cria o usuário definitivo
        UserEntity user = new UserEntity();
        user.setEmail(pending.getEmail());
        user.setPasswordHash(pending.getPasswordHash());
        user.setNickname(pending.getNickname());
        user.setPhone(pending.getPhone());
        
        user = userRepository.save(user);
        walletService.ensureUserWallets(user.getId());
        
        // Remove o registro pendente
        pendingRepository.delete(pending);
        
        logger.info("Registration confirmed and user created: {} (id: {})", user.getEmail(), user.getId());
        
        return new RegistrationResult(user.getId(), user.getEmail());
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public record RegistrationResult(Long userId, String email) {}
}
