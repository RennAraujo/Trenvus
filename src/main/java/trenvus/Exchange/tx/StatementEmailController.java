package trenvus.Exchange.tx;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import trenvus.Exchange.email.EmailService;
import trenvus.Exchange.user.UserRepository;

import java.util.Base64;

@RestController
@RequestMapping("/transactions")
public class StatementEmailController {
    private static final Logger logger = LoggerFactory.getLogger(StatementEmailController.class);

    private final EmailService emailService;
    private final UserRepository userRepository;

    public StatementEmailController(EmailService emailService, UserRepository userRepository) {
        this.emailService = emailService;
        this.userRepository = userRepository;
    }

    @PostMapping("/send-statement-email")
    public ResponseEntity<SendStatementResponse> sendStatementByEmail(
            @RequestBody SendStatementRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        
        Long userId = Long.valueOf(jwt.getSubject());
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        try {
            // Decode base64 PDF
            byte[] pdfBytes = Base64.getDecoder().decode(request.pdfBase64());
            
            // Send email with PDF attachment
            emailService.sendStatementPdf(
                    user.getEmail(),
                    user.getNickname() != null ? user.getNickname() : user.getEmail(),
                    pdfBytes,
                    request.fileName()
            );

            logger.info("Statement PDF sent by email to: {}", user.getEmail());
            return ResponseEntity.ok(new SendStatementResponse("success", "Statement sent to your email"));
        } catch (Exception e) {
            logger.error("Failed to send statement by email: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new SendStatementResponse("error", "Failed to send email: " + e.getMessage()));
        }
    }

    public record SendStatementRequest(String pdfBase64, String fileName) {}
    public record SendStatementResponse(String status, String message) {}
}
