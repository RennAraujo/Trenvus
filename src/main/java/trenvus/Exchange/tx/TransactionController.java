package trenvus.Exchange.tx;

import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/transactions")
@Validated
public class TransactionController {
	private final TransactionRepository transactions;

	public TransactionController(TransactionRepository transactions) {
		this.transactions = transactions;
	}

	@GetMapping("/private")
	public ResponseEntity<List<PrivateStatementItem>> privateStatement(
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
		var items = result.getContent().stream().map(TransactionController::toPrivateItem).toList();
		return ResponseEntity.ok(items);
	}

	private static PrivateStatementItem toPrivateItem(TransactionEntity tx) {
		if (tx.getType() == TransactionType.DEPOSIT_USD) {
			return new PrivateStatementItem(List.of(new ValueLine("USD", tx.getUsdAmountCents())));
		}
		if (tx.getType() == TransactionType.CONVERT_USD_TO_VPS) {
			var usd = tx.getUsdAmountCents() == null ? 0 : tx.getUsdAmountCents();
			var vps = tx.getVpsAmountCents() == null ? 0 : tx.getVpsAmountCents();
			var fee = tx.getFeeUsdCents() == null ? 0 : tx.getFeeUsdCents();
			return new PrivateStatementItem(List.of(
					new ValueLine("USD", -usd),
					new ValueLine("VPS", vps),
					new ValueLine("USD", -fee)
			));
		}
		return new PrivateStatementItem(List.of());
	}

	public record PrivateStatementItem(List<ValueLine> values) {}

	public record ValueLine(String currency, long cents) {}
}

