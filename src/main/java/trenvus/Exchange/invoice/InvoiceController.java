package trenvus.Exchange.invoice;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import trenvus.Exchange.wallet.WalletController.WalletResponse;

import java.math.BigDecimal;

@RestController
@RequestMapping("/invoices")
@Validated
public class InvoiceController {
    private static final Logger logger = LoggerFactory.getLogger(InvoiceController.class);
    
    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @PostMapping("/pay")
    public ResponseEntity<WalletResponse> payInvoice(
            @Valid @RequestBody PayInvoiceRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = Long.valueOf(jwt.getSubject());
        logger.info("Pay invoice request from user: {}", userId);
        var result = invoiceService.processQrPayment(userId, request);
        return ResponseEntity.ok(result);
    }
    
    /**
     * Simulate payment for demo/testing purposes.
     * This allows a user to simulate receiving a payment without needing a second account.
     */
    @PostMapping("/simulate-pay")
    public ResponseEntity<SimulatePayResponse> simulatePayInvoice(
            @Valid @RequestBody PayInvoiceRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long recipientId = Long.valueOf(jwt.getSubject());
        logger.info("Simulate pay invoice request for recipient: {}", recipientId);
        
        // Use a fixed "simulated payer" ID (999999) for demo purposes
        var result = invoiceService.simulateQrPayment(recipientId, request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/generate")
    public ResponseEntity<InvoiceQrResponse> generateInvoice(
            @Valid @RequestBody GenerateInvoiceRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = Long.valueOf(jwt.getSubject());
        String userEmail = jwt.getClaimAsString("email");
        String userNickname = jwt.getClaimAsString("nickname");
        
        var qrData = invoiceService.generateQrData(userId, userEmail, userNickname, request);
        return ResponseEntity.ok(qrData);
    }

    public record PayInvoiceRequest(
            @NotBlank String qrPayload,
            @NotNull @Positive BigDecimal amount,
            @NotBlank String currency
    ) {}

    public record GenerateInvoiceRequest(
            @NotNull @Positive BigDecimal amount,
            @NotBlank String currency,
            String description
    ) {}

    public record InvoiceQrResponse(
            String qrPayload,
            String qrCodeId,
            BigDecimal amount,
            String currency,
            String recipientEmail,
            String recipientNickname
    ) {}
    
    public record SimulatePayResponse(
            Long simulatedPayerId,
            String simulatedPayerEmail,
            Long recipientId,
            BigDecimal amount,
            String currency,
            Long newBalanceCents
    ) {}
}
