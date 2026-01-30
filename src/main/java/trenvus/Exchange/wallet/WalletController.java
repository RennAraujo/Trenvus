package trenvus.Exchange.wallet;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import trenvus.Exchange.exchange.ExchangeService;
import trenvus.Exchange.money.MoneyCents;

@RestController
@RequestMapping("/wallet")
@Validated
public class WalletController {
	private final WalletService walletService;
	private final ExchangeService exchangeService;

	public WalletController(WalletService walletService, ExchangeService exchangeService) {
		this.walletService = walletService;
		this.exchangeService = exchangeService;
	}

	@GetMapping
	public ResponseEntity<WalletResponse> getWallet(@AuthenticationPrincipal Jwt jwt) {
		Long userId = Long.valueOf(jwt.getSubject());
		var snapshot = walletService.getSnapshot(userId);
		return ResponseEntity.ok(new WalletResponse(snapshot.usdCents(), snapshot.vpsCents()));
	}

	@PostMapping("/deposit")
	public ResponseEntity<WalletOperationResponse> deposit(@Valid @RequestBody DepositRequest request,
			@AuthenticationPrincipal Jwt jwt) {
		Long userId = Long.valueOf(jwt.getSubject());
		long cents = MoneyCents.parseToCents(request.amountUsd());
		var result = exchangeService.depositUsd(userId, cents);
		return ResponseEntity.ok(new WalletOperationResponse(result.usdCents(), result.vpsCents(), result.transactionId()));
	}

	public record DepositRequest(@NotBlank String amountUsd) {}

	public record WalletResponse(long usdCents, long vpsCents) {}

	public record WalletOperationResponse(long usdCents, long vpsCents, Long transactionId) {}
}
