package trenvus.Exchange.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/auth")
public class TokenRevocationController {
    private static final Logger logger = LoggerFactory.getLogger(TokenRevocationController.class);
    
    private final TokenBlacklistService tokenBlacklistService;
    
    public TokenRevocationController(TokenBlacklistService tokenBlacklistService) {
        this.tokenBlacklistService = tokenBlacklistService;
    }
    
    @PostMapping("/revoke")
    public ResponseEntity<RevokeResponse> revokeCurrentToken(@AuthenticationPrincipal Jwt jwt) {
        String jti = jwt.getId();
        String subject = jwt.getSubject();
        Instant expiresAt = jwt.getExpiresAt();
        
        if (jti == null) {
            logger.warn("Token without jti cannot be revoked - sub: {}", subject);
            return ResponseEntity.badRequest()
                    .body(new RevokeResponse("error", "Token cannot be revoked (no jti)"));
        }
        
        Long userId = Long.valueOf(subject);
        tokenBlacklistService.revokeToken(jti, userId, expiresAt);
        
        logger.info("Token revoked via endpoint - jti: {}, userId: {}", jti, userId);
        return ResponseEntity.ok(new RevokeResponse("success", "Token revoked successfully"));
    }
    
    public record RevokeResponse(String status, String message) {}
}
