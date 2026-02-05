package trenvus.Exchange.transfer;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import trenvus.Exchange.money.MoneyCents;

@RestController
@RequestMapping("/transfer")
@Validated
public class TransferController {
	private final TransferService transferService;

	public TransferController(TransferService transferService) {
		this.transferService = transferService;
	}

	@PostMapping("/trv")
	public ResponseEntity<TransferResponse> transferTrv(
			@Valid @RequestBody TransferRequest request,
			@AuthenticationPrincipal Jwt jwt
	) {
		Long userId = Long.valueOf(jwt.getSubject());
		long cents = MoneyCents.parseToCents(request.amountTrv());
		var result = transferService.transferTrv(userId, request.toEmail(), cents);
		return ResponseEntity.ok(new TransferResponse(result.usdCents(), result.trvCents(), result.transactionId(), result.feeTrvCents()));
	}

	public record TransferRequest(@NotBlank @Email String toEmail, @NotBlank String amountTrv) {}

	public record TransferResponse(long usdCents, long trvCents, Long transactionId, long feeTrvCents) {}
}

