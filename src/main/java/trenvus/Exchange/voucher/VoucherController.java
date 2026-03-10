package trenvus.Exchange.voucher;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/voucher")
public class VoucherController {
    private static final Logger logger = LoggerFactory.getLogger(VoucherController.class);

    private final VoucherService voucherService;

    public VoucherController(VoucherService voucherService) {
        this.voucherService = voucherService;
    }

    @PostMapping("/generate")
    public ResponseEntity<VoucherResponse> generateVoucher(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.valueOf(jwt.getSubject());
        logger.info("Generating voucher for user: {}", userId);

        var voucher = voucherService.generateVoucher(userId);

        return ResponseEntity.ok(new VoucherResponse(
                voucher.getCode(),
                voucher.getCreatedAt().toString(),
                voucher.getExpiresAt() != null ? voucher.getExpiresAt().toString() : null,
                buildVoucherUrl(voucher.getCode())
        ));
    }

    @GetMapping("/my")
    public ResponseEntity<VoucherResponse> getMyVoucher(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.valueOf(jwt.getSubject());
        logger.info("Getting voucher for user: {}", userId);

        var voucherOpt = voucherService.getUserVoucher(userId);
        if (voucherOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var voucher = voucherOpt.get();
        return ResponseEntity.ok(new VoucherResponse(
                voucher.getCode(),
                voucher.getCreatedAt().toString(),
                voucher.getExpiresAt() != null ? voucher.getExpiresAt().toString() : null,
                buildVoucherUrl(voucher.getCode())
        ));
    }

    @DeleteMapping("/my")
    public ResponseEntity<Void> deactivateMyVoucher(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.valueOf(jwt.getSubject());
        logger.info("Deactivating voucher for user: {}", userId);

        voucherService.deactivateVoucher(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/profile/{code}")
    public ResponseEntity<VoucherProfileResponse> getVoucherProfile(@PathVariable String code) {
        logger.info("Getting voucher profile for code: {}", code);

        try {
            var profile = voucherService.getVoucherProfile(code);
            return ResponseEntity.ok(new VoucherProfileResponse(
                    profile.userId(),
                    profile.nickname(),
                    profile.email(),
                    profile.avatarDataUrl(),
                    profile.trvBalanceCents(),
                    profile.verified(),
                    profile.voucherCode(),
                    profile.createdAt().toString(),
                    profile.expiresAt() != null ? profile.expiresAt().toString() : null
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private String buildVoucherUrl(String code) {
        return "/voucher/view/" + code;
    }

    public record VoucherResponse(
            String code,
            String createdAt,
            String expiresAt,
            String viewUrl
    ) {}

    public record VoucherProfileResponse(
            Long userId,
            String nickname,
            String email,
            String avatarDataUrl,
            long trvBalanceCents,
            boolean verified,
            String voucherCode,
            String createdAt,
            String expiresAt
    ) {}
}
