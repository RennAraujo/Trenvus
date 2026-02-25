package trenvus.Exchange.mercadopago;

import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.preference.PreferenceClient;
import com.mercadopago.client.preference.PreferenceItemRequest;
import com.mercadopago.client.preference.PreferenceBackUrlsRequest;
import com.mercadopago.client.preference.PreferencePayerRequest;
import com.mercadopago.client.preference.PreferenceRequest;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.resources.preference.Preference;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collections;
import java.util.Locale;
import java.util.logging.Logger;

@Service
public class MercadoPagoService {

    private static final Logger logger = Logger.getLogger(MercadoPagoService.class.getName());

    private final PreferenceClient preferenceClient;
    private final PaymentClient paymentClient;

    @Value("${mercadopago.public-key}")
    private String publicKey;

    @Value("${mercadopago.return-url:http://localhost:5173/mercadopago/return}")
    private String returnUrl;

    public MercadoPagoService() {
        logger.info("Inicializando MercadoPagoService...");
        this.preferenceClient = new PreferenceClient();
        this.paymentClient = new PaymentClient();
        logger.info("MercadoPagoService inicializado com sucesso");
    }

    /**
     * Cria uma preferência de pagamento no Mercado Pago
     */
    public MercadoPagoPreferenceResponse createPreference(BigDecimal amount, String currency, Long userId, Locale locale) throws MPException, MPApiException {
        logger.info("Iniciando criação de preferência - User: " + userId + ", Amount: " + amount);
        
        try {
            // Arredonda para 2 casas decimais
            amount = amount.setScale(2, RoundingMode.HALF_UP);

            // NO AMBIENTE DE TESTE DO MERCADO PAGO BRASIL, SÓ FUNCIONA COM BRL
            String effectiveCurrency = "BRL";
            logger.info("Usando moeda: " + effectiveCurrency);

            // Determina a descrição baseada no locale
            String description = isPortuguese(locale)
                ? "Depósito Trenvus - Usuário " + userId
                : "Trenvus Deposit - User " + userId;
            logger.info("Descrição: " + description);

            // Cria o item
            logger.info("Criando item...");
            PreferenceItemRequest itemRequest = PreferenceItemRequest.builder()
                .title(description)
                .quantity(1)
                .unitPrice(amount)
                .currencyId(effectiveCurrency)
                .build();
            logger.info("Item criado com sucesso");

            // Cria o pagador
            logger.info("Criando pagador...");
            PreferencePayerRequest payerRequest = PreferencePayerRequest.builder()
                .email("user" + userId + "@trenvus.com")
                .build();
            logger.info("Pagador criado com sucesso");

            // URLs de retorno
            logger.info("Configurando URLs de retorno...");
            PreferenceBackUrlsRequest backUrlsRequest = PreferenceBackUrlsRequest.builder()
                .success(returnUrl + "?mercadopago=success")
                .failure(returnUrl + "?mercadopago=failure")
                .pending(returnUrl + "?mercadopago=pending")
                .build();
            logger.info("URLs configuradas: success=" + returnUrl + "?mercadopago=success");

            // Cria a preferência
            logger.info("Criando preferência no Mercado Pago...");
            PreferenceRequest preferenceRequest = PreferenceRequest.builder()
                .items(Collections.singletonList(itemRequest))
                .payer(payerRequest)
                .backUrls(backUrlsRequest)
                .externalReference(userId.toString())
                .build();

            logger.info("Enviando requisição para Mercado Pago API...");
            Preference preference = preferenceClient.create(preferenceRequest);
            logger.info("Preferência criada com sucesso! ID: " + preference.getId());

            return new MercadoPagoPreferenceResponse(
                preference.getId(),
                preference.getInitPoint(),
                preference.getSandboxInitPoint(),
                publicKey
            );
        } catch (Exception e) {
            logger.severe("Erro ao criar preferência: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Verifica o status de um pagamento
     */
    public MercadoPagoPaymentResponse getPayment(Long paymentId) throws MPException, MPApiException {
        logger.info("Buscando pagamento: " + paymentId);
        Payment payment = paymentClient.get(paymentId);
        logger.info("Pagamento encontrado: " + payment.getStatus());

        return new MercadoPagoPaymentResponse(
            payment.getId(),
            payment.getStatus(),
            payment.getStatusDetail(),
            payment.getTransactionAmount(),
            payment.getCurrencyId(),
            payment.getExternalReference()
        );
    }

    /**
     * Verifica se o locale é português
     */
    private boolean isPortuguese(Locale locale) {
        if (locale == null) return false;
        return "pt".equalsIgnoreCase(locale.getLanguage()) ||
               locale.toString().toLowerCase().startsWith("pt");
    }

    public String getPublicKey() {
        return publicKey;
    }

    // Records para respostas
    public record MercadoPagoPreferenceResponse(String preferenceId, String initPoint, String sandboxInitPoint, String publicKey) {}
    public record MercadoPagoPaymentResponse(Long paymentId, String status, String statusDetail, BigDecimal amount, String currency, String externalReference) {}
}
