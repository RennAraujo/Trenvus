package trenvus.Exchange.paypal;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Locale;

@RestController
@RequestMapping("/paypal")
public class PayPalController {

    private final PayPalService payPalService;

    public PayPalController(PayPalService payPalService) {
        this.payPalService = payPalService;
    }

    /**
     * Cria uma ordem de pagamento no PayPal
     * 
     * @param request Dados do pagamento
     * @param jwt Token do usuário
     * @param locale Locale para determinar idioma e moeda
     * @return URL de aprovação do PayPal
     */
    @PostMapping("/create-order")
    public ResponseEntity<PayPalOrderCreateResponse> createOrder(
            @RequestBody PayPalOrderRequest request,
            @AuthenticationPrincipal Jwt jwt,
            Locale locale) {
        
        Long userId = Long.valueOf(jwt.getSubject());
        
        // Determina a moeda baseada no locale
        String currency = isPortuguese(locale) ? "BRL" : "USD";
        
        try {
            PayPalService.PayPalOrderResponse order = payPalService.createOrder(
                request.amount(), 
                currency, 
                userId, 
                locale
            );
            
            return ResponseEntity.ok(new PayPalOrderCreateResponse(
                order.orderId(),
                order.approvalUrl(),
                order.status()
            ));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(new PayPalOrderCreateResponse(
                null,
                null,
                "ERROR: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Captura um pagamento aprovado (chamado após o usuário aprovar no PayPal)
     */
    @PostMapping("/capture/{orderId}")
    public ResponseEntity<PayPalCaptureResponse> captureOrder(
            @PathVariable String orderId) {
        
        try {
            PayPalService.PayPalCaptureResponse capture = payPalService.captureOrder(orderId);
            
            return ResponseEntity.ok(new PayPalCaptureResponse(
                capture.orderId(),
                capture.captureId(),
                capture.status(),
                capture.amount(),
                capture.currency()
            ));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(new PayPalCaptureResponse(
                null,
                null,
                "ERROR: " + e.getMessage(),
                null,
                null
            ));
        }
    }
    
    /**
     * Verifica se o locale é português
     */
    private boolean isPortuguese(Locale locale) {
        if (locale == null) return false;
        return "pt".equalsIgnoreCase(locale.getLanguage()) || 
               locale.toString().toLowerCase().startsWith("pt");
    }
    
    // Records para requests e responses
    public record PayPalOrderRequest(BigDecimal amount) {}
    public record PayPalOrderCreateResponse(String orderId, String approvalUrl, String status) {}
    public record PayPalCaptureResponse(String orderId, String captureId, String status, BigDecimal amount, String currency) {}
}
