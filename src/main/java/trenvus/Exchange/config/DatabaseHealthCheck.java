package trenvus.Exchange.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

@Component
@Order(1)  // Run first
public class DatabaseHealthCheck implements ApplicationRunner {
    private static final Logger logger = LoggerFactory.getLogger(DatabaseHealthCheck.class);

    private final DataSource dataSource;

    public DatabaseHealthCheck(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) {
        logger.info("========================================");
        logger.info("Database Health Check STARTING");
        
        int maxRetries = 10;
        int retryDelayMs = 2000;
        
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger.info("Attempt {}/{}: Testing database connection...", attempt, maxRetries);
                
                try (Connection connection = dataSource.getConnection()) {
                    if (connection.isValid(5)) {
                        logger.info("✓ Database connection successful!");
                        logger.info("========================================");
                        return;
                    }
                }
            } catch (SQLException e) {
                logger.warn("Attempt {}/{} failed: {}", attempt, maxRetries, e.getMessage());
                
                if (attempt < maxRetries) {
                    logger.info("Waiting {}ms before retry...", retryDelayMs);
                    try {
                        Thread.sleep(retryDelayMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Interrupted while waiting for database", ie);
                    }
                }
            }
        }
        
        logger.error("✗ Failed to connect to database after {} attempts", maxRetries);
        logger.error("Application will start but may not function correctly");
        logger.info("========================================");
    }
}
