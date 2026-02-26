package trenvus.Exchange.user;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Base64;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
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

@RestController
@RequestMapping("/me")
@Validated
public class MeController {
	private final UserRepository users;
	private final WalletRepository wallets;
	private final TransactionRepository transactions;
	private final PasswordEncoder passwordEncoder;
	private static final long AVATAR_MAX_BYTES = 1_000_000;

	public MeController(UserRepository users, WalletRepository wallets, TransactionRepository transactions, PasswordEncoder passwordEncoder) {
		this.users = users;
		this.wallets = wallets;
		this.transactions = transactions;
		this.passwordEncoder = passwordEncoder;
	}

	@GetMapping
	public ResponseEntity<MeResponse> getMe(@AuthenticationPrincipal Jwt jwt) {
		Long userId = Long.valueOf(jwt.getSubject());
		var user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
		return ResponseEntity.ok(new MeResponse(user.getEmail(), user.getNickname(), user.getPhone(), toAvatarDataUrl(user)));
	}

	@PutMapping("/phone")
	public ResponseEntity<MeResponse> updatePhone(@Valid @RequestBody UpdatePhoneRequest request, @AuthenticationPrincipal Jwt jwt) {
		Long userId = Long.valueOf(jwt.getSubject());
		var user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
		user.setPhone(request.phone().trim());
		user = users.save(user);
		return ResponseEntity.ok(new MeResponse(user.getEmail(), user.getNickname(), user.getPhone(), toAvatarDataUrl(user)));
	}

	@PutMapping("/password")
	public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request, @AuthenticationPrincipal Jwt jwt) {
		Long userId = Long.valueOf(jwt.getSubject());
		var user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

		if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
			throw new IllegalArgumentException("Senha atual incorreta");
		}
		user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
		users.save(user);
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/avatar")
	public ResponseEntity<MeResponse> uploadAvatar(@RequestParam("file") MultipartFile file, @AuthenticationPrincipal Jwt jwt) {
		Long userId = Long.valueOf(jwt.getSubject());
		var user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("Arquivo inválido");
		}
		if (file.getSize() > AVATAR_MAX_BYTES) {
			throw new IllegalArgumentException("Imagem deve ter no máximo 1MB");
		}
		var contentType = file.getContentType();
		if (contentType == null || contentType.isBlank()) {
			throw new IllegalArgumentException("Tipo de imagem inválido");
		}
		if (!contentType.equals("image/png")
				&& !contentType.equals("image/jpeg")
				&& !contentType.equals("image/webp")
				&& !contentType.equals("image/gif")
		) {
			throw new IllegalArgumentException("Tipo de imagem inválido");
		}

		byte[] bytes;
		try {
			bytes = file.getBytes();
		} catch (Exception e) {
			throw new IllegalArgumentException("Falha ao ler arquivo");
		}
		var b64 = Base64.getEncoder().encodeToString(bytes);
		var dataUrl = "data:" + contentType + ";base64," + b64;
		user.setAvatarDataUrl(dataUrl);
		user = users.save(user);
		return ResponseEntity.ok(new MeResponse(user.getEmail(), user.getNickname(), user.getPhone(), toAvatarDataUrl(user)));
	}

	@DeleteMapping
	@Transactional
	public ResponseEntity<Void> deleteAccount(@Valid @RequestBody DeleteAccountRequest request, @AuthenticationPrincipal Jwt jwt) {
		Long userId = Long.valueOf(jwt.getSubject());
		var user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

		// Verifica se o email corresponde
		if (!user.getEmail().equalsIgnoreCase(request.email())) {
			throw new IllegalArgumentException("Email não corresponde");
		}

		// Verifica se a senha está correta
		if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw new IllegalArgumentException("Senha incorreta");
		}

		// Deleta todas as transações do usuário
		var userTransactions = transactions.findByUserId(userId);
		transactions.deleteAll(userTransactions);

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

	public record MeResponse(String email, String nickname, String phone, String avatarDataUrl) {}
}
