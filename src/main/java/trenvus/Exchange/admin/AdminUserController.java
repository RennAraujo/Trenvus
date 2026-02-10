package trenvus.Exchange.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import trenvus.Exchange.user.UserRole;

@RestController
@RequestMapping("/admin")
@Validated
public class AdminUserController {
	private final AdminUserService adminUsers;

	public AdminUserController(AdminUserService adminUsers) {
		this.adminUsers = adminUsers;
	}

	@GetMapping("/users")
	public ResponseEntity<?> listUsers(
			@RequestParam(required = false) String q,
			@RequestParam(defaultValue = "100") @Min(1) int limit
	) {
		return ResponseEntity.ok(adminUsers.listUsers(q, limit));
	}

	@GetMapping("/users/{userId}")
	public ResponseEntity<?> getUser(@PathVariable Long userId) {
		return ResponseEntity.ok(adminUsers.getUser(userId));
	}

	@GetMapping("/users/{userId}/wallet")
	public ResponseEntity<WalletResponse> getWallet(@PathVariable Long userId) {
		var snapshot = adminUsers.getUserWallet(userId);
		return ResponseEntity.ok(new WalletResponse(snapshot.usdCents(), snapshot.trvCents()));
	}

	@GetMapping("/users/{userId}/fees")
	public ResponseEntity<AdminUserService.FeeIncomeResponse> getFeeIncome(
			@PathVariable Long userId,
			@RequestParam(defaultValue = "50") @Min(1) int size
	) {
		return ResponseEntity.ok(adminUsers.getUserFeeIncome(userId, size));
	}

	@PutMapping("/users/{userId}/wallet")
	public ResponseEntity<WalletResponse> setWallet(@PathVariable Long userId, @Valid @RequestBody SetWalletRequest request) {
		var snapshot = adminUsers.setUserBalances(userId, request.usd(), request.trv());
		return ResponseEntity.ok(new WalletResponse(snapshot.usdCents(), snapshot.trvCents()));
	}

	@PutMapping("/users/{userId}/role")
	public ResponseEntity<?> setRole(@PathVariable Long userId, @Valid @RequestBody SetRoleRequest request) {
		UserRole role;
		try {
			role = UserRole.valueOf(request.role());
		} catch (IllegalArgumentException ex) {
			role = UserRole.USER;
		}
		return ResponseEntity.ok(adminUsers.setUserRole(userId, role));
	}

	public record SetWalletRequest(@NotBlank String usd, @NotBlank String trv) {}

	public record WalletResponse(long usdCents, long trvCents) {}

	public record SetRoleRequest(@NotBlank String role) {}
}
