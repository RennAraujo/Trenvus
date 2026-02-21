package trenvus.Exchange.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import trenvus.Exchange.user.UserEntity;

@Service
public class TokenService {
	private final JwtEncoder jwtEncoder;
	private final SecureRandom secureRandom = new SecureRandom();
	private final String issuer;
	private final long accessTtlSeconds;
	private final long refreshTtlSeconds;

	public TokenService(
			JwtEncoder jwtEncoder,
			@Value("${JWT_ISSUER:trenvus}") String issuer,
			@Value("${JWT_ACCESS_TTL_SECONDS:900}") long accessTtlSeconds,
			@Value("${JWT_REFRESH_TTL_SECONDS:2592000}") long refreshTtlSeconds
	) {
		this.jwtEncoder = jwtEncoder;
		this.issuer = issuer;
		this.accessTtlSeconds = accessTtlSeconds;
		this.refreshTtlSeconds = refreshTtlSeconds;
	}

	public AccessTokenResult createAccessToken(UserEntity user, Instant now) {
		var expiresAt = now.plusSeconds(accessTtlSeconds);
		var claimsBuilder = JwtClaimsSet.builder()
				.issuer(issuer)
				.issuedAt(now)
				.expiresAt(expiresAt)
				.subject(String.valueOf(user.getId()))
				.claim("email", user.getEmail())
				.claim("roles", List.of((user.getRole() == null ? "USER" : user.getRole().name())));
		
		// Only add nickname if it's not null
		if (user.getNickname() != null && !user.getNickname().isBlank()) {
			claimsBuilder.claim("nickname", user.getNickname());
		}
		
		var claims = claimsBuilder.build();

		var header = JwsHeader.with(SignatureAlgorithm.RS256).build();
		var tokenValue = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
		return new AccessTokenResult(tokenValue, expiresAt);
	}

	public RefreshTokenResult createRefreshToken(Instant now) {
		var tokenBytes = new byte[32];
		secureRandom.nextBytes(tokenBytes);
		var token = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
		var tokenHash = sha256Hex(token);
		var expiresAt = now.plusSeconds(refreshTtlSeconds);
		return new RefreshTokenResult(token, tokenHash, expiresAt);
	}

	public static String sha256Hex(String value) {
		try {
			var digest = MessageDigest.getInstance("SHA-256");
			var bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(bytes);
		} catch (Exception e) {
			throw new IllegalStateException("Unable to hash value", e);
		}
	}

	public record AccessTokenResult(String token, Instant expiresAt) {}
	public record RefreshTokenResult(String token, String tokenHash, Instant expiresAt) {}
}
