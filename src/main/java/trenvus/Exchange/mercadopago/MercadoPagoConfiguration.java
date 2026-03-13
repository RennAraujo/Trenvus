package trenvus.Exchange.mercadopago;

import com.mercadopago.MercadoPagoConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.util.logging.Logger;

@Configuration
public class MercadoPagoConfiguration {

    private static final Logger logger = Logger.getLogger(MercadoPagoConfiguration.class.getName());

    @Value("${mercadopago.access-token:}")
    private String accessToken;

    private static boolean configured = false;

    @PostConstruct
    public void init() {
        if (accessToken == null || accessToken.isEmpty() || accessToken.startsWith("YOUR_")) {
            logger.warning("MERCADO PAGO ACCESS TOKEN IS NOT CONFIGURED - Mercado Pago integration will be disabled");
            configured = false;
            return;
        }
        logger.info("Configuring Mercado Pago with access token (length: " + accessToken.length() + ")");
        MercadoPagoConfig.setAccessToken(accessToken);
        configured = true;
        logger.info("Mercado Pago configured successfully");
    }

    public static boolean isConfigured() {
        return configured;
    }
}
