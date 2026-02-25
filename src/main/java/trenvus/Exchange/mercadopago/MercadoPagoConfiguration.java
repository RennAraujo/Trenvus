package trenvus.Exchange.mercadopago;

import com.mercadopago.MercadoPagoConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.util.logging.Logger;

@Configuration
public class MercadoPagoConfiguration {

    private static final Logger logger = Logger.getLogger(MercadoPagoConfiguration.class.getName());

    @Value("${mercadopago.access-token}")
    private String accessToken;

    @PostConstruct
    public void init() {
        if (accessToken == null || accessToken.isEmpty()) {
            logger.severe("MERCADO PAGO ACCESS TOKEN IS NOT CONFIGURED!");
            throw new IllegalStateException("Mercado Pago access token is not configured");
        }
        logger.info("Configuring Mercado Pago with access token (length: " + accessToken.length() + ")");
        MercadoPagoConfig.setAccessToken(accessToken);
        logger.info("Mercado Pago configured successfully");
    }
}
