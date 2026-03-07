package trenvus.Exchange.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class TokenBlacklistService {
    private static final Logger logger = LoggerFactory.getLogger(TokenBlacklistService.class);
    
    private final RevokedTokenRepository revokedTokenRepository;
    
    public TokenBlacklistService(RevokedTokenRepository revokedTokenRepository) {
        this.revokedTokenRepository = revokedTokenRepository;
    }
    
    @Transactional
    public void revokeToken(String jti, Long userId, Instant expiresAt) {
        if (jti == null || jti.isBlank()) {
            logger.warn("Cannot revoke token without jti");
            return;
        }
        
        logger.info("Attempting to revoke token - jti: {}, userId: {}", jti, userId);
        
        if (revokedTokenRepository.existsByTokenJti(jti)) {
            logger.info("Token {} already revoked", jti);
            return;
        }
        
        var revokedToken = new RevokedTokenEntity();
        revokedToken.setTokenJti(jti);
        revokedToken.setUserId(userId);
        revokedToken.setRevokedAt(Instant.now());
        revokedToken.setExpiresAt(expiresAt);
        
        revokedTokenRepository.save(revokedToken);
        logger.info("Token revoked successfully - jti: {}, userId: {}", jti, userId);
    }
    
    @Transactional(readOnly = true)
    public boolean isTokenRevoked(String jti) {
        if (jti == null || jti.isBlank()) {
            return false; // Tokens without jti cannot be revoked (backward compatibility)
        }
        return revokedTokenRepository.existsByTokenJti(jti);
    }
    
    @Transactional
    public int cleanupExpiredTokens() {
        var cutoff = Instant.now();
        int deleted = revokedTokenRepository.deleteExpiredTokens(cutoff);
        logger.info("Cleaned up {} expired revoked tokens", deleted);
        return deleted;
    }
}
