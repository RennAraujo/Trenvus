package trenvus.Exchange.admin;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import trenvus.Exchange.tx.TransactionEntity;
import trenvus.Exchange.tx.TransactionRepository;
import trenvus.Exchange.tx.TransactionType;
import trenvus.Exchange.user.UserEntity;
import trenvus.Exchange.user.UserRepository;
import trenvus.Exchange.user.UserRole;
import trenvus.Exchange.wallet.Currency;
import trenvus.Exchange.wallet.WalletRepository;
import trenvus.Exchange.wallet.WalletService;

@Service
public class AdminUserService {
	private final UserRepository users;
	private final WalletRepository wallets;
	private final WalletService walletService;
	private final TransactionRepository transactions;

	public AdminUserService(UserRepository users, WalletRepository wallets, WalletService walletService, TransactionRepository transactions) {
		this.users = users;
		this.wallets = wallets;
		this.walletService = walletService;
		this.transactions = transactions;
	}

	@Transactional(readOnly = true)
	public List<UserSummary> listUsers(String query, int limit) {
		int max = Math.max(1, Math.min(limit, 500));
		String q = query == null ? "" : query.trim().toLowerCase();
		return users.findAll().stream()
				.filter(u -> q.isBlank() || (u.getEmail() != null && u.getEmail().toLowerCase().contains(q)))
				.sorted(Comparator.comparing(UserEntity::getId).reversed())
				.limit(max)
				.map(u -> new UserSummary(u.getId(), u.getEmail(), u.getRole()))
				.toList();
	}

	@Transactional(readOnly = true)
	public UserSummary getUser(Long userId) {
		var user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
		return new UserSummary(user.getId(), user.getEmail(), user.getRole());
	}

	@Transactional(readOnly = true)
	public WalletService.WalletSnapshot getUserWallet(Long userId) {
		return walletService.getSnapshot(userId);
	}

	@Transactional(readOnly = true)
	public FeeIncomeResponse getUserFeeIncome(Long userId, int size) {
		int pageSize = Math.max(1, Math.min(size, 100));
		long totalUsdCents = transactions.sumUsdAmountCentsByUserIdAndType(userId, TransactionType.FEE_INCOME_USD);
		var page = transactions.findByUserIdAndTypeOrderByIdDesc(userId, TransactionType.FEE_INCOME_USD, PageRequest.of(0, pageSize));

		var sourceIds = page.getContent().stream()
				.map(TransactionEntity::getSourceUserId)
				.filter(Objects::nonNull)
				.distinct()
				.toList();
		Map<Long, String> sourceEmails = users.findAllById(sourceIds).stream()
				.collect(java.util.stream.Collectors.toMap(UserEntity::getId, u -> u.getEmail() == null ? "" : u.getEmail()));

		var items = page.getContent().stream().map(tx -> {
			Long id = tx.getId();
			String tec = id == null ? "TEC-UNKNOWN" : "TEC-" + String.format("%010d", id);
			long usd = tx.getUsdAmountCents() == null ? 0 : tx.getUsdAmountCents();
			Long srcId = tx.getSourceUserId();
			String srcEmail = srcId == null ? null : sourceEmails.getOrDefault(srcId, null);
			return new FeeIncomeItem(id, tec, tx.getCreatedAt(), usd, srcId, srcEmail);
		}).toList();

		return new FeeIncomeResponse(totalUsdCents, items);
	}

	@Transactional
	public WalletService.WalletSnapshot setUserBalances(Long userId, String usd, String trv) {
		long usdCents = parseCentsAllowZero(usd);
		long trvCents = parseCentsAllowZero(trv);

		walletService.ensureUserWallets(userId);
		var locked = wallets.findForUpdate(userId, List.of(Currency.USD, Currency.TRV));

		var usdWallet = locked.stream().filter(w -> w.getCurrency() == Currency.USD).findFirst().orElseThrow();
		var trvWallet = locked.stream().filter(w -> w.getCurrency() == Currency.TRV).findFirst().orElseThrow();

		long deltaUsd = Math.subtractExact(usdCents, usdWallet.getBalanceCents());
		long deltaTrv = Math.subtractExact(trvCents, trvWallet.getBalanceCents());

		usdWallet.setBalanceCents(usdCents);
		trvWallet.setBalanceCents(trvCents);

		var tx = new TransactionEntity();
		tx.setUserId(userId);
		tx.setType(TransactionType.ADMIN_ADJUST_WALLET);
		tx.setUsdAmountCents(deltaUsd);
		tx.setTrvAmountCents(deltaTrv);
		transactions.save(tx);

		return walletService.getSnapshot(userId);
	}

	@Transactional
	public UserSummary setUserRole(Long userId, UserRole role) {
		var user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
		user.setRole(role == null ? UserRole.USER : role);
		user = users.save(user);
		return new UserSummary(user.getId(), user.getEmail(), user.getRole());
	}

	private static long parseCentsAllowZero(String value) {
		if (value == null || value.isBlank()) {
			throw new IllegalArgumentException("Valor inválido");
		}
		try {
			var amount = new BigDecimal(value.trim());
			amount = amount.setScale(2, RoundingMode.UNNECESSARY);
			if (amount.signum() < 0) {
				throw new IllegalArgumentException("Valor não pode ser negativo");
			}
			return amount.movePointRight(2).longValueExact();
		} catch (ArithmeticException ex) {
			throw new IllegalArgumentException("Valor deve ter no máximo 2 casas decimais");
		} catch (NumberFormatException ex) {
			throw new IllegalArgumentException("Valor inválido");
		}
	}

	public record UserSummary(Long id, String email, UserRole role) {}

	public record FeeIncomeItem(Long id, String tec, java.time.Instant createdAt, long usdCents, Long sourceUserId, String sourceEmail) {}

	public record FeeIncomeResponse(long totalUsdCents, List<FeeIncomeItem> items) {}
}
