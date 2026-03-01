package trenvus.Exchange.user;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Base64;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import trenvus.Exchange.wallet.WalletRepository;
import trenvus.Exchange.tx.TransactionRepository;
import trenvus.Exchange.auth.RefreshTokenRepository;

@RestController
@RequestMapping("/me")
@Validated
public class MeController {
	private static final Logger logger = LoggerFactory.getLogger(MeController.class);
	
	private final UserRepository users;
	private final WalletRepository wallets;
	private final TransactionRepository transactions;
	private final RefreshTokenRepository refreshTokens;
	private final PasswordEncoder passwordEncoder;
	private final ConfirmationService confirmationService;
	private static final long AVATAR_MAX_BYTES = 1_000_000;

	public MeController(UserRepository users, WalletRepository wallets, TransactionRepository transactions, RefreshTokenRepository refreshTokens, PasswordEncoder passwordEncoder, ConfirmationService confirmationService) {
		this.users = users;
		this.wallets = wallets;
		this.transactions = transactions;
		this.refreshTokens = refreshTokens;
		this.passwordEncoder = passwordEncoder;
		this.confirmationService = confirmationService;
	}

	@GetMapping
	public ResponseEntity<MeResponse> getMe(@AuthenticationPrincipal Jwt jwt) {
		Long userId = Long.valueOf(jwt.getSubject());
		var user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
		return ResponseEntity.ok(new MeResponse(user.getEmail(), user.getNickname(), user.getPhone(), toAvatarDataUrl(user)));
	}

	@PutMapping("/phone")
	public ResponseEntity<MeResponse> updatePhone(@Valid @RequestBody UpdatePhoneRequest request, @AuthenticationPrincipal Jwt jwt) {
		Long userId = Long.valueOf(jwt.getSubject());
		var user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
		user.setPhone(request.phone().trim());
		user = users.save(user);
		return ResponseEntity.ok(new MeResponse(user.getEmail(), user.getNickname(), user.getPhone(), toAvatarDataUrl(user)));
	}

	@PutMapping("/password")
	public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request, @AuthenticationPrincipal Jwt jwt) {
		Long userId = Long.valueOf(jwt.getSubject());
		var user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));

		if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
			throw new IllegalArgumentException("Current password is incorrect");
		}
		user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
		users.save(user);
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/avatar")
	public ResponseEntity<MeResponse> uploadAvatar(@RequestParam("file") MultipartFile file, @AuthenticationPrincipal Jwt jwt) {
		Long userId = Long.valueOf(jwt.getSubject());
		var user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));

		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("Invalid file");
		}
		if (file.getSize() > AVATAR_MAX_BYTES) {
			throw new IllegalArgumentException("Image must be at most 1MB");
		}
		var contentType = file.getContentType();
		if (contentType == null || contentType.isBlank()) {
			throw new IllegalArgumentException("Invalid image type");
		}
		if (!contentType.equals("image/png")
				&& !contentType.equals("image/jpeg")
				&& !contentType.equals("image/webp")
				&& !contentType.equals("image/gif")
		) {
			throw new IllegalArgumentException("Invalid image type");
		}

		byte[] bytes;
		try {
			bytes = file.getBytes();
		} catch (Exception e) {
			throw new IllegalArgumentException("Failed to read file");
		}
		var b64 = Base64.getEncoder().encodeToString(bytes);
		var dataUrl = "data:" + contentType + ";base64," + b64;
		user.setAvatarDataUrl(dataUrl);
		user = users.save(user);
		return ResponseEntity.ok(new MeResponse(user.getEmail(), user.getNickname(), user.getPhone(), toAvatarDataUrl(user)));
	}

	@PostMapping("/delete-request")
	public ResponseEntity<DeleteRequestResponse> requestAccountDeletion(@Valid @RequestBody DeleteAccountRequest request, @AuthenticationPrincipal Jwt jwt) {
		Long userId = Long.valueOf(jwt.getSubject());
		var user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));

		// Verifica se o email corresponde
		if (!user.getEmail().equalsIgnoreCase(request.email())) {
			throw new IllegalArgumentException("Email does not match");
		}

		// Verifica se a senha está correta
		if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw new IllegalArgumentException("Password is incorrect");
		}

		// Envia email de confirmação
		try {
			logger.info("Sending deletion confirmation email to: {}", user.getEmail());
			confirmationService.createDeletionConfirmation(userId, user.getEmail());
			logger.info("Deletion confirmation email sent successfully");
			return ResponseEntity.ok(new DeleteRequestResponse("success", "Email de confirmação enviado. Verifique sua caixa de entrada."));
		} catch (Exception e) {
			logger.error("Failed to send deletion confirmation email: {}", e.getMessage());
			return ResponseEntity.badRequest().body(new DeleteRequestResponse("error", "Falha ao enviar email de confirmação: " + e.getMessage()));
		}
	}

	@PostMapping("/delete")
	@Transactional
	public ResponseEntity<Void> deleteAccount(@AuthenticationPrincipal Jwt jwt) {
		Long userId = Long.valueOf(jwt.getSubject());
		var user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));

		// Deleta todos os refresh tokens do usuário
		var userRefreshTokens = refreshTokens.findByUserId(userId);
		refreshTokens.deleteAll(userRefreshTokens);

		// Deleta todas as transações onde o usuário é o destinatário (user_id)
		var userTransactions = transactions.findByUserId(userId);
		transactions.deleteAll(userTransactions);

		// Deleta todas as transações onde o usuário é o remetente (source_user_id)
		var sentTransactions = transactions.findBySourceUserId(userId);
		transactions.deleteAll(sentTransactions);

		// Deleta todas as wallets do usuário
		var userWallets = wallets.findByUserId(userId);
		wallets.deleteAll(userWallets);

		// Deleta o usuário
		users.delete(user);

		return ResponseEntity.noContent().build();
	}

	private static String toAvatarDataUrl(UserEntity user) {
		var dataUrl = user.getAvatarDataUrl();
		if (dataUrl == null || dataUrl.isBlank()) return null;
		return dataUrl;
	}

	public record UpdatePhoneRequest(@NotBlank String phone) {}

	public record ChangePasswordRequest(@NotBlank String currentPassword, @NotBlank @Size(min = 4) String newPassword) {}

	public record DeleteAccountRequest(@NotBlank String email, @NotBlank String password) {}

	public record DeleteRequestResponse(String status, String message) {}

	public record MeResponse(String email, String nickname, String phone, String avatarDataUrl) {}
}
