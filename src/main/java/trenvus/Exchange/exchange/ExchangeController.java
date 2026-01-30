package trenvus.Exchange.exchange;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import trenvus.Exchange.money.MoneyCents;

@RestController
@RequestMapping("/exchange")
@Validated
public class ExchangeController {
	private final ExchangeService exchangeService;

	public ExchangeController(ExchangeService exchangeService) {
		this.exchangeService = exchangeService;
	}

	@PostMapping("/convert")
	public ResponseEntity<ConvertResponse> convert(
			@Valid @RequestBody ConvertRequest request,
			@RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
			@AuthenticationPrincipal Jwt jwt
	) {
		Long userId = Long.valueOf(jwt.getSubject());
		long cents = MoneyCents.parseToCents(request.amountUsd());
		var result = exchangeService.convertUsdToVps(userId, cents, idempotencyKey);
		return ResponseEntity.ok(new ConvertResponse(result.usdCents(), result.vpsCents(), result.transactionId(), result.feeUsdCents()));
	}

	public record ConvertRequest(@NotBlank String amountUsd) {}

	public record ConvertResponse(long usdCents, long vpsCents, Long transactionId, long feeUsdCents) {}
}
