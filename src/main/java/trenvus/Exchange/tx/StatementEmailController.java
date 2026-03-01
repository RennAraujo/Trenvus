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
            
            // Determine language (default to pt-BR)
            String language = request.language() != null ? request.language() : "pt-BR";
            
            // Send email with PDF attachment
            emailService.sendStatementPdf(
                    user.getEmail(),
                    user.getNickname() != null ? user.getNickname() : user.getEmail(),
                    pdfBytes,
                    request.fileName(),
                    language
            );

            logger.info("Statement PDF sent by email to: {} in language: {}", user.getEmail(), language);
            return ResponseEntity.ok(new SendStatementResponse("success", 
                    language.equals("en") ? "Statement sent to your email" : "Extrato enviado para seu email"));
        } catch (Exception e) {
            logger.error("Failed to send statement by email: {}", e.getMessage());
            String language = request.language() != null ? request.language() : "pt-BR";
            String errorMsg = language.equals("en") 
                    ? "Failed to send email: " + e.getMessage()
                    : "Falha ao enviar email: " + e.getMessage();
            return ResponseEntity.badRequest()
                    .body(new SendStatementResponse("error", errorMsg));
        }
    }

    public record SendStatementRequest(String pdfBase64, String fileName, String language) {}
    public record SendStatementResponse(String status, String message) {}
}
