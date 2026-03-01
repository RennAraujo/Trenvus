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
        
        // Verifica se email já existe
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Remove qualquer registro pendente anterior
        pendingRepository.findByEmail(email).ifPresent(pending -> {
            logger.info("Removing previous pending registration for: {}", email);
            pendingRepository.delete(pending);
        });

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
    public UserEntity confirmRegistration(String token) {
        logger.info("Confirming registration with token: {}", token.substring(0, Math.min(10, token.length())) + "...");
        
        // Log para debug - verificar tokens no banco
        var allPending = pendingRepository.findAll();
        logger.info("Total pending registrations in DB: {}", allPending.size());
        for (var p : allPending) {
            logger.info("Pending: email={}, token={}...", p.getEmail(), p.getToken().substring(0, Math.min(10, p.getToken().length())));
        }
        
        PendingRegistration pending = pendingRepository.findByToken(token)
                .orElseThrow(() -> {
                    logger.warn("Token not found in database: {}...", token.substring(0, Math.min(10, token.length())));
                    return new IllegalArgumentException("Invalid or expired token");
                });

        if (pending.isExpired()) {
            pendingRepository.delete(pending);
            throw new IllegalArgumentException("Token has expired. Please register again.");
        }

        // Verifica novamente se email já existe (pode ter sido criado por outro meio)
        if (userRepository.existsByEmail(pending.getEmail())) {
            pendingRepository.delete(pending);
            throw new IllegalArgumentException("Email already registered");
        }

        // Cria o usuário
        UserEntity user = new UserEntity();
        user.setEmail(pending.getEmail());
        user.setPasswordHash(pending.getPasswordHash());
        user.setNickname(pending.getNickname());
        user.setPhone(pending.getPhone());

        user = userRepository.save(user);
        logger.info("User created successfully: {} (id: {})", user.getEmail(), user.getId());

        // Cria wallets
        walletService.ensureUserWallets(user.getId());

        // Remove o registro pendente
        pendingRepository.delete(pending);
        logger.info("Pending registration removed for: {}", user.getEmail());

        return user;
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
