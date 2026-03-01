package trenvus.Exchange.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/confirm")
public class ConfirmationController {
    private static final Logger logger = LoggerFactory.getLogger(ConfirmationController.class);

    private final ConfirmationService confirmationService;

    public ConfirmationController(ConfirmationService confirmationService) {
        this.confirmationService = confirmationService;
    }

    @GetMapping("/registration")
    public ResponseEntity<ConfirmationResponse> confirmRegistration(@RequestParam String token) {
        logger.info("Registration confirmation requested");
        
        try {
            ConfirmationService.ConfirmationResult result = confirmationService.verifyRegistrationToken(token);
            
            logger.info("Registration confirmed for user: {}", result.userId());
            return ResponseEntity.ok(new ConfirmationResponse(
                "success",
                "Cadastro confirmado com sucesso! Você já pode fazer login na plataforma.",
                result.email()
            ));
        } catch (IllegalArgumentException e) {
            logger.warn("Registration confirmation failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ConfirmationResponse(
                "error",
                e.getMessage(),
                null
            ));
        }
    }

    @GetMapping("/deletion")
    public ResponseEntity<ConfirmationResponse> confirmDeletion(@RequestParam String token) {
        logger.info("Account deletion confirmation requested");
        
        try {
            ConfirmationService.ConfirmationResult result = confirmationService.verifyDeletionToken(token);
            
            logger.info("Deletion confirmed for user: {}", result.userId());
            return ResponseEntity.ok(new ConfirmationResponse(
                "success",
                "Exclusão de conta confirmada. Sua conta será removida permanentemente.",
                result.email()
            ));
        } catch (IllegalArgumentException e) {
            logger.warn("Deletion confirmation failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ConfirmationResponse(
                "error",
                e.getMessage(),
                null
            ));
        }
    }

    public record ConfirmationResponse(String status, String message, String email) {}
}
