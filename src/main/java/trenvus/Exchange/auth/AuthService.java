package trenvus.Exchange.auth;

import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import trenvus.Exchange.user.ConfirmationService;
import trenvus.Exchange.user.UserEntity;
import trenvus.Exchange.user.UserRepository;
import trenvus.Exchange.wallet.WalletService;

@Service
public class AuthService {
	private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
	
	private final UserRepository users;
	private final RefreshTokenRepository refreshTokens;
	private final PasswordEncoder passwordEncoder;
	private final AuthenticationManager authenticationManager;
	private final TokenService tokenService;
	private final WalletService walletService;
	private final ConfirmationService confirmationService;

	public AuthService(
			UserRepository users,
			RefreshTokenRepository refreshTokens,
			PasswordEncoder passwordEncoder,
			AuthenticationManager authenticationManager,
			TokenService tokenService,
			WalletService walletService,
			ConfirmationService confirmationService
	) {
		this.users = users;
		this.refreshTokens = refreshTokens;
		this.passwordEncoder = passwordEncoder;
		this.authenticationManager = authenticationManager;
		this.tokenService = tokenService;
		this.walletService = walletService;
		this.confirmationService = confirmationService;
	}

	@Transactional
	public AuthResult register(String email, String password, String nickname, String phone) {
		logger.info("Register attempt for: {}", email);
		if (users.existsByEmail(email)) {
			throw new AuthExceptions.EmailAlreadyRegisteredException();
		}

		var user = new UserEntity();
		user.setEmail(email);
		user.setPasswordHash(passwordEncoder.encode(password));
		
		// Set optional fields
		if (nickname != null && !nickname.isBlank()) {
			user.setNickname(nickname.trim());
		}
		if (phone != null && !phone.isBlank()) {
			user.setPhone(phone.trim());
		}
		
		user = users.save(user);
		walletService.ensureUserWallets(user.getId());

		// Send confirmation email
		try {
			logger.info("Sending registration confirmation email to: {}", email);
			confirmationService.createRegistrationConfirmation(user.getId(), email);
			logger.info("Registration confirmation email sent successfully to: {}", email);
		} catch (Exception e) {
			logger.error("Failed to send registration confirmation email to {}: {}", email, e.getMessage());
			// Don't fail registration if email fails, but log it
		}

		logger.info("User registered successfully: {}", email);
		return issueTokens(user, Instant.now());
	}

	@Transactional
	public AuthResult login(String email, String password) {
		logger.info("Login attempt for: {}", email);
		authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
		var user = users.findByEmail(email).orElseThrow(AuthExceptions.InvalidCredentialsException::new);
		logger.info("User authenticated: {} (id: {}, role: {})", email, user.getId(), user.getRole());
		return issueTokens(user, Instant.now());
	}

	@Transactional
	public AuthResult refresh(String refreshToken) {
		var now = Instant.now();
		var hash = TokenService.sha256Hex(refreshToken);
		var existing = refreshTokens.findByTokenHash(hash).orElseThrow(AuthExceptions.InvalidRefreshTokenException::new);

		if (existing.getRevokedAt() != null) {
			throw new AuthExceptions.InvalidRefreshTokenException();
		}
		if (existing.getExpiresAt().isBefore(now)) {
			throw new AuthExceptions.ExpiredRefreshTokenException();
		}

		refreshTokens.revoke(hash, now);

		var user = users.findById(existing.getUserId()).orElseThrow(AuthExceptions.InvalidUserException::new);
		return issueTokens(user, now);
	}

	@Transactional
	public void logout(String refreshToken) {
		if (refreshToken == null || refreshToken.isBlank()) {
			return;
		}
		var now = Instant.now();
		var hash = TokenService.sha256Hex(refreshToken);
		refreshTokens.revoke(hash, now);
	}

	private AuthResult issueTokens(UserEntity user, Instant now) {
		logger.info("Issuing tokens for user: {} (id: {})", user.getEmail(), user.getId());
		try {
			var access = tokenService.createAccessToken(user, now);
			logger.info("Access token created: token present={}, expiresAt={}", 
				access.token() != null, access.expiresAt());
			
			var refresh = tokenService.createRefreshToken(now);
			logger.info("Refresh token created: token present={}, tokenHash present={}, expiresAt={}",
				refresh.token() != null, refresh.tokenHash() != null, refresh.expiresAt());

			var entity = new RefreshTokenEntity();
			logger.info("Setting userId: {}", user.getId());
			entity.setUserId(user.getId());
			logger.info("Setting tokenHash: {}", refresh.tokenHash() != null ? "present (length=" + refresh.tokenHash().length() + ")" : "NULL");
			entity.setTokenHash(refresh.tokenHash());
			logger.info("Setting expiresAt: {}", refresh.expiresAt());
			entity.setExpiresAt(refresh.expiresAt());
			logger.info("Setting createdAt: {}", now);
			entity.setCreatedAt(now);  // Explicitly set createdAt
			
			logger.info("About to save RefreshTokenEntity...");
			refreshTokens.save(entity);
			logger.info("Tokens issued successfully for: {}", user.getEmail());

			return new AuthResult(access.token(), access.expiresAt(), refresh.token());
		} catch (Exception e) {
			logger.error("Failed to issue tokens for user: {} - {}", user.getEmail(), e.getMessage(), e);
			throw e;
		}
	}

	public record AuthResult(String accessToken, Instant accessExpiresAt, String refreshToken) {}
}
