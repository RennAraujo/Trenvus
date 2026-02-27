package trenvus.Exchange.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import trenvus.Exchange.tx.TransactionRepository;
import trenvus.Exchange.tx.TransactionType;
import trenvus.Exchange.user.UserRole;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
@Validated
public class AdminUserController {
	private final AdminUserService adminUsers;
	private final TransactionRepository transactions;

	public AdminUserController(AdminUserService adminUsers, TransactionRepository transactions) {
		this.adminUsers = adminUsers;
		this.transactions = transactions;
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

	@GetMapping("/users/{userId}/statement")
	public ResponseEntity<StatementResponse> getUserStatement(
			@PathVariable Long userId,
			@RequestParam(defaultValue = "0") @Min(0) int page,
			@RequestParam(defaultValue = "20") @Min(1) int size
	) {
		int pageSize = Math.min(size, 100);
		var pageable = PageRequest.of(page, pageSize);
		var txPage = transactions.findByUserIdOrderByIdDesc(userId, pageable);

		var items = txPage.getContent().stream().map(tx -> {
			Long id = tx.getId();
			String tec = id == null ? "TEC-UNKNOWN" : "TEC-" + String.format("%010d", id);
			return new StatementItem(
					id,
					tec,
					tx.getType(),
					tx.getCreatedAt(),
					tx.getUsdAmountCents(),
					tx.getTrvAmountCents(),
					tx.getFeeUsdCents(),
					tx.getSourceUserId()
			);
		}).collect(Collectors.toList());

		return ResponseEntity.ok(new StatementResponse(items, txPage.hasNext()));
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

	public record StatementItem(
			Long id,
			String tec,
			TransactionType type,
			Instant createdAt,
			Long usdAmountCents,
			Long trvAmountCents,
			Long feeUsdCents,
			Long sourceUserId
	) {}

	public record StatementResponse(List<StatementItem> items, boolean hasNext) {}
}
