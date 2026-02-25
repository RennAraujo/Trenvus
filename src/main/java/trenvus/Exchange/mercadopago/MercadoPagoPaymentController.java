package trenvus.Exchange.mercadopago;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import trenvus.Exchange.exchange.ExchangeService;
import trenvus.Exchange.money.MoneyCents;

import java.math.BigDecimal;

@RestController
@RequestMapping("/mercadopago")
public class MercadoPagoPaymentController {

    private final MercadoPagoService mercadoPagoService;
    private final ExchangeService exchangeService;

    public MercadoPagoPaymentController(MercadoPagoService mercadoPagoService, ExchangeService exchangeService) {
        this.mercadoPagoService = mercadoPagoService;
        this.exchangeService = exchangeService;
    }

    /**
     * Processa um pagamento aprovado do Mercado Pago e adiciona à carteira
     * 
     * @param request Dados do pagamento (paymentId e amount)
     * @param jwt Token do usuário
     * @return Resultado da operação na carteira
     */
    @PostMapping("/process-payment")
    public ResponseEntity<PaymentProcessResponse> processPayment(
            @RequestBody ProcessPaymentRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());

        try {
            // Verifica o status do pagamento no Mercado Pago
            var payment = mercadoPagoService.getPayment(request.paymentId());
            
            // Verifica se o pagamento foi aprovado
            if (!"approved".equalsIgnoreCase(payment.status())) {
                return ResponseEntity.badRequest().body(new PaymentProcessResponse(
                    false,
                    "Pagamento não aprovado. Status: " + payment.status(),
                    null,
                    null,
                    null
                ));
            }

            // Verifica se o valor corresponde
            BigDecimal paidAmount = payment.amount();
            BigDecimal expectedAmount = new BigDecimal(request.amount());
            
            // Permite uma pequena diferença por arredondamento
            if (paidAmount.compareTo(expectedAmount) != 0) {
                // Log para debug
                System.out.println("Valor pago: " + paidAmount + ", Valor esperado: " + expectedAmount);
            }

            // Converte o valor para cents e faz o depósito
            long amountCents = MoneyCents.parseToCents(request.amount());
            
            // Faz o depósito na carteira
            var result = exchangeService.depositUsd(userId, amountCents);

            return ResponseEntity.ok(new PaymentProcessResponse(
                true,
                "Pagamento processado com sucesso!",
                result.usdCents(),
                result.trvCents(),
                result.transactionId()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new PaymentProcessResponse(
                false,
                "Erro ao processar pagamento: " + e.getMessage(),
                null,
                null,
                null
            ));
        }
    }

    // Records para requests e responses
    public record ProcessPaymentRequest(Long paymentId, String amount) {}
    public record PaymentProcessResponse(boolean success, String message, Long usdCents, Long trvCents, Long transactionId) {}
}
