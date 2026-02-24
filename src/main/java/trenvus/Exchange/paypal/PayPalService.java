package trenvus.Exchange.paypal;

import com.paypal.core.PayPalHttpClient;
import com.paypal.http.HttpResponse;
import com.paypal.orders.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class PayPalService {

    private final PayPalHttpClient payPalHttpClient;

    @Value("${paypal.return-url:http://localhost:5173/dashboard}")
    private String returnUrl;

    @Value("${paypal.cancel-url:http://localhost:5173/dashboard}")
    private String cancelUrl;

    public PayPalService(PayPalHttpClient payPalHttpClient) {
        this.payPalHttpClient = payPalHttpClient;
    }

    /**
     * Cria uma ordem de pagamento no PayPal
     * 
     * @param amount Valor do pagamento
     * @param currency Moeda (USD ou BRL)
     * @param userId ID do usuário para referência
     * @param locale Locale para determinar a língua da página PayPal
     * @return OrderResponse com ID da ordem e link de aprovação
     */
    public PayPalOrderResponse createOrder(BigDecimal amount, String currency, Long userId, Locale locale) throws IOException {
        // Arredonda para 2 casas decimais
        amount = amount.setScale(2, RoundingMode.HALF_UP);
        
        // Determina a descrição baseada no locale
        String description = isPortuguese(locale) 
            ? "Depósito Trenvus - " + userId 
            : "Trenvus Deposit - " + userId;

        OrderRequest orderRequest = new OrderRequest();
        orderRequest.checkoutPaymentIntent("CAPTURE");
        
        // Configura o valor
        Money money = new Money();
        money.currencyCode(currency);
        money.value(amount.toString());
        
        // Configura o item
        Item item = new Item();
        item.name(description);
        item.unitAmount(money);
        item.quantity("1");
        
        List<Item> items = new ArrayList<>();
        items.add(item);
        
        // Configura o valor total
        AmountWithBreakdown amountBreakdown = new AmountWithBreakdown();
        amountBreakdown.currencyCode(currency);
        amountBreakdown.value(amount.toString());
        
        // Configura a unidade de compra
        PurchaseUnitRequest purchaseUnit = new PurchaseUnitRequest();
        purchaseUnit.amountWithBreakdown(amountBreakdown);
        purchaseUnit.description(description);
        purchaseUnit.items(items);
        
        // Adiciona referência customizada
        purchaseUnit.customId(userId.toString());
        purchaseUnit.invoiceId("TRV-" + System.currentTimeMillis() + "-" + userId);
        
        List<PurchaseUnitRequest> purchaseUnits = new ArrayList<>();
        purchaseUnits.add(purchaseUnit);
        orderRequest.purchaseUnits(purchaseUnits);
        
        // Configura as URLs de retorno
        ApplicationContext applicationContext = new ApplicationContext();
        applicationContext.returnUrl(returnUrl + "?paypal=success");
        applicationContext.cancelUrl(cancelUrl + "?paypal=cancel");
        
        // Configura o locale para a página PayPal
        String localeString = isPortuguese(locale) ? "pt_BR" : "en_US";
        applicationContext.locale(localeString);
        
        // Configura a experiência de checkout
        applicationContext.shippingPreference("NO_SHIPPING");
        applicationContext.userAction("PAY_NOW");
        
        orderRequest.applicationContext(applicationContext);
        
        // Cria a ordem
        OrdersCreateRequest request = new OrdersCreateRequest();
        request.requestBody(orderRequest);
        
        HttpResponse<Order> response = payPalHttpClient.execute(request);
        Order order = response.result();
        
        // Extrai o link de aprovação
        String approvalUrl = order.links().stream()
            .filter(link -> "approve".equals(link.rel()))
            .findFirst()
            .map(LinkDescription::href)
            .orElseThrow(() -> new RuntimeException("Approval URL not found"));
        
        return new PayPalOrderResponse(order.id(), approvalUrl, order.status());
    }
    
    /**
     * Captura um pagamento aprovado
     */
    public PayPalCaptureResponse captureOrder(String orderId) throws IOException {
        OrdersCaptureRequest request = new OrdersCaptureRequest(orderId);
        request.requestBody(new OrderRequest());
        
        HttpResponse<Order> response = payPalHttpClient.execute(request);
        Order order = response.result();
        
        // Extrai informações do pagamento
        PurchaseUnit purchaseUnit = order.purchaseUnits().get(0);
        Capture capture = purchaseUnit.payments().captures().get(0);
        
        return new PayPalCaptureResponse(
            order.id(),
            capture.id(),
            order.status(),
            new BigDecimal(capture.amount().value()),
            capture.amount().currencyCode()
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
    
    // Records para respostas
    public record PayPalOrderResponse(String orderId, String approvalUrl, String status) {}
    public record PayPalCaptureResponse(String orderId, String captureId, String status, BigDecimal amount, String currency) {}
}
