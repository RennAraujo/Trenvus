package trenvus.Exchange.voucher;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import trenvus.Exchange.user.UserEntity;
import trenvus.Exchange.user.UserRepository;
import trenvus.Exchange.wallet.WalletService;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Optional;

@Service
public class VoucherService {
    private static final Logger logger = LoggerFactory.getLogger(VoucherService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int CODE_LENGTH = 32;

    private final VoucherRepository voucherRepository;
    private final UserRepository userRepository;
    private final WalletService walletService;

    public VoucherService(VoucherRepository voucherRepository, UserRepository userRepository, WalletService walletService) {
        this.voucherRepository = voucherRepository;
        this.userRepository = userRepository;
        this.walletService = walletService;
    }

    @Transactional
    public VoucherEntity generateVoucher(Long userId) {
        logger.info("Generating voucher for user: {}", userId);

        // Verifica se usuário já tem voucher
        Optional<VoucherEntity> existing = voucherRepository.findByUserId(userId);
        if (existing.isPresent()) {
            VoucherEntity voucher = existing.get();
            if (!voucher.isExpired()) {
                logger.info("User {} already has active voucher: {}", userId, voucher.getCode());
                return voucher;
            }
            // Voucher expirado, desativa
            voucher.setActive(false);
            voucherRepository.save(voucher);
        }

        // Cria novo voucher
        VoucherEntity voucher = new VoucherEntity();
        voucher.setUserId(userId);
        voucher.setCode(generateUniqueCode());
        voucher.setActive(true);
        voucher.setCreatedAt(Instant.now());
        voucher.setExpiresAt(Instant.now().plus(30, ChronoUnit.DAYS)); // Válido por 30 dias

        voucher = voucherRepository.save(voucher);
        logger.info("Voucher generated for user {}: {}", userId, voucher.getCode());
        return voucher;
    }

    @Transactional(readOnly = true)
    public Optional<VoucherEntity> getVoucherByCode(String code) {
        return voucherRepository.findByCode(code)
                .filter(VoucherEntity::isActive)
                .filter(v -> !v.isExpired());
    }

    @Transactional(readOnly = true)
    public Optional<VoucherEntity> getUserVoucher(Long userId) {
        return voucherRepository.findByUserId(userId)
                .filter(VoucherEntity::isActive)
                .filter(v -> !v.isExpired());
    }

    @Transactional
    public void deactivateVoucher(Long userId) {
        voucherRepository.findByUserId(userId).ifPresent(voucher -> {
            voucher.setActive(false);
            voucherRepository.save(voucher);
            logger.info("Voucher deactivated for user: {}", userId);
        });
    }

    @Transactional(readOnly = true)
    public VoucherProfileResponse getVoucherProfile(String code) {
        VoucherEntity voucher = voucherRepository.findByCode(code)
                .filter(VoucherEntity::isActive)
                .filter(v -> !v.isExpired())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired voucher"));

        UserEntity user = userRepository.findById(voucher.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        var wallet = walletService.getSnapshot(user.getId());

        return new VoucherProfileResponse(
                user.getId(),
                user.getNickname(),
                user.getEmail(),
                user.getAvatarDataUrl(),
                wallet.trvCents(),
                user.isVerified(),
                voucher.getCode(),
                voucher.getCreatedAt(),
                voucher.getExpiresAt()
        );
    }

    private String generateUniqueCode() {
        byte[] bytes = new byte[CODE_LENGTH];
        String code;
        do {
            RANDOM.nextBytes(bytes);
            code = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        } while (voucherRepository.existsByCode(code));
        return code;
    }

    public record VoucherProfileResponse(
            Long userId,
            String nickname,
            String email,
            String avatarDataUrl,
            long trvBalanceCents,
            boolean verified,
            String voucherCode,
            Instant createdAt,
            Instant expiresAt
    ) {}
}
