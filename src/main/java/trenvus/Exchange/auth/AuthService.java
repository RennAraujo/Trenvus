package trenvus.Exchange.auth;

import java.time.Instant;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import trenvus.Exchange.user.UserEntity;
import trenvus.Exchange.user.UserRepository;
import trenvus.Exchange.wallet.WalletService;

@Service
public class AuthService {
	private final UserRepository users;
	private final RefreshTokenRepository refreshTokens;
	private final PasswordEncoder passwordEncoder;
	private final AuthenticationManager authenticationManager;
	private final TokenService tokenService;
	private final WalletService walletService;

	public AuthService(
			UserRepository users,
			RefreshTokenRepository refreshTokens,
			PasswordEncoder passwordEncoder,
			AuthenticationManager authenticationManager,
			TokenService tokenService,
			WalletService walletService
	) {
		this.users = users;
		this.refreshTokens = refreshTokens;
		this.passwordEncoder = passwordEncoder;
		this.authenticationManager = authenticationManager;
		this.tokenService = tokenService;
		this.walletService = walletService;
	}

	@Transactional
	public AuthResult register(String email, String password) {
		if (users.existsByEmail(email)) {
			throw new AuthExceptions.EmailAlreadyRegisteredException();
		}

		var user = new UserEntity();
		user.setEmail(email);
		user.setPasswordHash(passwordEncoder.encode(password));
		user = users.save(user);
		walletService.ensureUserWallets(user.getId());

		return issueTokens(user, Instant.now());
	}

	@Transactional
	public AuthResult login(String email, String password) {
		authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
		var user = users.findByEmail(email).orElseThrow(AuthExceptions.InvalidCredentialsException::new);
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
		var access = tokenService.createAccessToken(user, now);
		var refresh = tokenService.createRefreshToken(now);

		var entity = new RefreshTokenEntity();
		entity.setUserId(user.getId());
		entity.setTokenHash(refresh.tokenHash());
		entity.setExpiresAt(refresh.expiresAt());
		refreshTokens.save(entity);

		return new AuthResult(access.token(), access.expiresAt(), refresh.token());
	}

	public record AuthResult(String accessToken, Instant accessExpiresAt, String refreshToken) {}
}
