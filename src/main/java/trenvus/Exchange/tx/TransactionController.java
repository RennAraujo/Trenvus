package trenvus.Exchange.tx;

import java.util.List;
import java.time.Instant;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import trenvus.Exchange.user.UserRepository;

@RestController
@RequestMapping("/transactions")
@Validated
public class TransactionController {
	private final TransactionRepository transactions;
	private final UserRepository users;

	public TransactionController(TransactionRepository transactions, UserRepository users) {
		this.transactions = transactions;
		this.users = users;
	}

	@GetMapping("/private")
	public ResponseEntity<PrivateStatementResponse> privateStatement(
			@AuthenticationPrincipal Jwt jwt,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size
	) {
		if (page < 0) {
			throw new IllegalArgumentException("Página inválida");
		}
		if (size < 1 || size > 100) {
			throw new IllegalArgumentException("Tamanho inválido");
		}

		Long userId = Long.valueOf(jwt.getSubject());
		var result = transactions.findByUserIdOrderByIdDesc(userId, PageRequest.of(page, size));
		var items = result.getContent().stream().map(this::toPrivateItem).toList();
		boolean hasNext = result.hasNext();
		return ResponseEntity.ok(new PrivateStatementResponse(items, hasNext));
	}

	private PrivateStatementItem toPrivateItem(TransactionEntity tx) {
		Long id = tx.getId();
		String tec = id == null ? "TEC-UNKNOWN" : "TEC-" + String.format("%010d", id);
		Instant createdAt = tx.getCreatedAt();
		TransactionType type = tx.getType();

		// Busca nickname do remetente para transferências recebidas
		String senderNickname = null;
		if (type == TransactionType.TRANSFER_TRV_IN && tx.getSourceUserId() != null) {
			senderNickname = users.findById(tx.getSourceUserId())
				.map(u -> u.getNickname() != null ? u.getNickname() : u.getEmail())
				.orElse(null);
		}

		if (tx.getType() == TransactionType.DEPOSIT_USD) {
			return new PrivateStatementItem(id, tec, type, createdAt, List.of(new ValueLine("USD", tx.getUsdAmountCents(), false)), null, senderNickname);
		}
		if (tx.getType() == TransactionType.CONVERT_USD_TO_TRV) {
			var usd = tx.getUsdAmountCents() == null ? 0 : tx.getUsdAmountCents();
			var trv = tx.getTrvAmountCents() == null ? 0 : tx.getTrvAmountCents();
			var fee = tx.getFeeUsdCents() == null ? 0 : tx.getFeeUsdCents();
			return new PrivateStatementItem(id, tec, type, createdAt, List.of(
					new ValueLine("USD", -usd, false),
					new ValueLine("TRV", trv, false),
					new ValueLine("USD", -fee, true)
			), null, senderNickname);
		}
		if (tx.getType() == TransactionType.CONVERT_TRV_TO_USD) {
			var usd = tx.getUsdAmountCents() == null ? 0 : tx.getUsdAmountCents();
			var trv = tx.getTrvAmountCents() == null ? 0 : tx.getTrvAmountCents();
			var fee = tx.getFeeUsdCents() == null ? 0 : tx.getFeeUsdCents();
			return new PrivateStatementItem(id, tec, type, createdAt, List.of(
					new ValueLine("TRV", -trv, false),
					new ValueLine("USD", usd, false),
					new ValueLine("USD", -fee, true)
			), null, senderNickname);
		}
		if (tx.getType() == TransactionType.TRANSFER_TRV_OUT) {
			var trv = tx.getTrvAmountCents() == null ? 0 : tx.getTrvAmountCents();
			return new PrivateStatementItem(id, tec, type, createdAt, List.of(
					new ValueLine("TRV", -trv, false)
			), null, senderNickname);
		}
		if (tx.getType() == TransactionType.TRANSFER_TRV_IN) {
			var trv = tx.getTrvAmountCents() == null ? 0 : tx.getTrvAmountCents();
			return new PrivateStatementItem(id, tec, type, createdAt, List.of(new ValueLine("TRV", trv, false)), null, senderNickname);
		}
		if (tx.getType() == TransactionType.ADMIN_ADJUST_WALLET) {
			var usd = tx.getUsdAmountCents() == null ? 0 : tx.getUsdAmountCents();
			var trv = tx.getTrvAmountCents() == null ? 0 : tx.getTrvAmountCents();
			var notes = tx.getNotes();
			var values = new java.util.ArrayList<ValueLine>();
			if (usd != 0) values.add(new ValueLine("USD", usd, false));
			if (trv != 0) values.add(new ValueLine("TRV", trv, false));
			return new PrivateStatementItem(id, tec, type, createdAt, values, notes, senderNickname);
		}
		return new PrivateStatementItem(id, tec, type, createdAt, List.of(), null, senderNickname);
	}

	public record PrivateStatementItem(Long id, String tec, TransactionType type, Instant createdAt, List<ValueLine> values, String notes, String senderNickname) {
		public PrivateStatementItem(Long id, String tec, TransactionType type, Instant createdAt, List<ValueLine> values) {
			this(id, tec, type, createdAt, values, null, null);
		}
		public PrivateStatementItem(Long id, String tec, TransactionType type, Instant createdAt, List<ValueLine> values, String notes) {
			this(id, tec, type, createdAt, values, notes, null);
		}
	}

	public record ValueLine(String currency, long cents, boolean fee) {}

	public record PrivateStatementResponse(List<PrivateStatementItem> items, boolean hasNext) {}
}
