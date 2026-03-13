package trenvus.Exchange.mercadopago;

import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/mercadopago")
public class MercadoPagoController {

    private final MercadoPagoService mercadoPagoService;

    public MercadoPagoController(MercadoPagoService mercadoPagoService) {
        this.mercadoPagoService = mercadoPagoService;
    }

    /**
     * Retorna a chave pública do Mercado Pago
     */
    @GetMapping("/public-key")
    public ResponseEntity<?> getPublicKey() {
        if (!MercadoPagoConfiguration.isConfigured()) {
            return ResponseEntity.status(503).body(Map.of(
                    "code", "MERCADOPAGO_NOT_CONFIGURED",
                    "message", "Mercado Pago is not configured"
            ));
        }
        return ResponseEntity.ok(new PublicKeyResponse(mercadoPagoService.getPublicKey()));
    }

    /**
     * Cria uma preferência de pagamento no Mercado Pago
     *
     * @param request Dados do pagamento
     * @param jwt Token do usuário
     * @param locale Locale para determinar idioma e moeda
     * @return Dados da preferência do Mercado Pago
     */
    @PostMapping("/create-preference")
    public ResponseEntity<?> createPreference(
            @RequestBody MercadoPagoPreferenceRequest request,
            @AuthenticationPrincipal Jwt jwt,
            Locale locale) {

        if (!MercadoPagoConfiguration.isConfigured()) {
            return ResponseEntity.status(503).body(Map.of(
                    "code", "MERCADOPAGO_NOT_CONFIGURED",
                    "message", "Mercado Pago is not configured"
            ));
        }

        Long userId = Long.valueOf(jwt.getSubject());

        // Determina a moeda baseada no locale
        String currency = isPortuguese(locale) ? "BRL" : "USD";

        try {
            MercadoPagoService.MercadoPagoPreferenceResponse preference = mercadoPagoService.createPreference(
                request.amount(),
                currency,
                userId,
                locale
            );

            return ResponseEntity.ok(new MercadoPagoPreferenceResponse(
                preference.preferenceId(),
                preference.initPoint(),
                preference.sandboxInitPoint(),
                preference.publicKey()
            ));
        } catch (MPApiException e) {
            int statusCode = e.getApiResponse() != null ? e.getApiResponse().getStatusCode() : 502;
            String content = e.getApiResponse() != null ? e.getApiResponse().getContent() : "";
            String code = (statusCode == 401 || (content != null && content.contains("invalid access token")))
                    ? "MERCADOPAGO_INVALID_TOKEN"
                    : "MERCADOPAGO_API_ERROR";
            return ResponseEntity.status(502).body(Map.of(
                    "code", code,
                    "status", statusCode,
                    "message", "Mercado Pago API error"
            ));
        } catch (MPException e) {
            return ResponseEntity.status(502).body(Map.of(
                    "code", "MERCADOPAGO_ERROR",
                    "message", "Mercado Pago error"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "code", "INTERNAL_ERROR",
                    "message", "Unable to create Mercado Pago preference"
            ));
        }
    }

    /**
     * Verifica o status de um pagamento
     */
    @GetMapping("/payment/{paymentId}")
    public ResponseEntity<?> getPayment(
            @PathVariable Long paymentId) {

        if (!MercadoPagoConfiguration.isConfigured()) {
            return ResponseEntity.status(503).body(Map.of(
                    "code", "MERCADOPAGO_NOT_CONFIGURED",
                    "message", "Mercado Pago is not configured"
            ));
        }

        try {
            MercadoPagoService.MercadoPagoPaymentResponse payment = mercadoPagoService.getPayment(paymentId);

            return ResponseEntity.ok(new MercadoPagoPaymentResponse(
                payment.paymentId(),
                payment.status(),
                payment.statusDetail(),
                payment.amount(),
                payment.currency(),
                payment.externalReference()
            ));
        } catch (MPException | MPApiException e) {
            return ResponseEntity.badRequest().body(new MercadoPagoPaymentResponse(
                null,
                "ERROR",
                e.getMessage(),
                null,
                null,
                null
            ));
        }
    }

    /**
     * Webhook para receber notificações do Mercado Pago
     */
    @PostMapping("/webhook")
    public ResponseEntity<?> webhook(@RequestBody Map<String, Object> payload) {
        if (!MercadoPagoConfiguration.isConfigured()) {
            return ResponseEntity.status(503).body(Map.of(
                    "code", "MERCADOPAGO_NOT_CONFIGURED",
                    "message", "Mercado Pago is not configured"
            ));
        }
        // Processa a notificação do Mercado Pago
        // TODO: Implementar lógica de webhook para atualizar saldo automaticamente
        return ResponseEntity.ok().build();
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
    public record MercadoPagoPreferenceRequest(BigDecimal amount) {}
    public record PublicKeyResponse(String publicKey) {}
    public record MercadoPagoPreferenceResponse(String preferenceId, String initPoint, String sandboxInitPoint, String publicKey) {}
    public record MercadoPagoPaymentResponse(Long paymentId, String status, String statusDetail, BigDecimal amount, String currency, String externalReference) {}
}
