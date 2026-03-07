package trenvus.Exchange.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.jwt.*;
import trenvus.Exchange.auth.TokenBlacklistService;

import java.time.Instant;

public class BlacklistAwareJwtDecoder implements JwtDecoder {
    private static final Logger logger = LoggerFactory.getLogger(BlacklistAwareJwtDecoder.class);
    
    private final JwtDecoder delegate;
    private final TokenBlacklistService blacklistService;
    
    public BlacklistAwareJwtDecoder(JwtDecoder delegate, TokenBlacklistService blacklistService) {
        this.delegate = delegate;
        this.blacklistService = blacklistService;
    }
    
    @Override
    public Jwt decode(String token) throws JwtException {
        // First decode the token using the delegate
        Jwt jwt = delegate.decode(token);
        
        // Check if token has been revoked
        String jti = jwt.getId();
        logger.debug("Checking token - jti: {}, sub: {}", jti, jwt.getSubject());
        
        if (jti != null && blacklistService.isTokenRevoked(jti)) {
            logger.warn("BLOCKED revoked token - jti: {}, sub: {}", jti, jwt.getSubject());
            throw new JwtValidationException("Token has been revoked", 
                java.util.Collections.singletonList(new OAuth2Error("token_revoked", "This token has been revoked", null)));
        }
        
        logger.debug("Token accepted - jti: {}", jti);
        return jwt;
    }
}
