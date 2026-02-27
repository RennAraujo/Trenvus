package trenvus.Exchange.email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

	@Value("${APP_BASE_URL:http://localhost:3000}")
	private String appBaseUrl;

	@Value("${SMTP_FROM:noreply@trenvus.com}")
	private String fromEmail;

	public void sendVerificationEmail(String toEmail, String token, String tokenType) {
		String subject = tokenType.equals("REGISTRATION")
				? "Confirm your registration"
				: "Confirm your email change";

		String verificationUrl = appBaseUrl + "/verify-email?token=" + token;

		String greeting = tokenType.equals("REGISTRATION") 
				? "Thank you for registering!" 
				: "You requested to change your email.";

		StringBuilder bodyBuilder = new StringBuilder();
		bodyBuilder.append("Hello,\n\n");
		bodyBuilder.append(greeting).append("\n\n");
		bodyBuilder.append("Please click the link below to verify your email:\n");
		bodyBuilder.append(verificationUrl).append("\n\n");
		bodyBuilder.append("This link will expire in 24 hours.\n\n");
		bodyBuilder.append("If you didn't request this, please ignore this email.\n\n");
		bodyBuilder.append("Best regards,\n");
		bodyBuilder.append("Trenvus Team");
		String body = bodyBuilder.toString();

		// Log to console (SMTP not configured - just log)
		System.out.println("========================================");
		System.out.println("EMAIL (Console Mode - SMTP not configured)");
		System.out.println("TO: " + toEmail);
		System.out.println("FROM: " + fromEmail);
		System.out.println("SUBJECT: " + subject);
		System.out.println("BODY:");
		System.out.println(body);
		System.out.println("========================================");
	}

	public void sendEmailChangedNotification(String oldEmail, String newEmail) {
		String subject = "Your email has been changed";
		
		StringBuilder bodyBuilder = new StringBuilder();
		bodyBuilder.append("Hello,\n\n");
		bodyBuilder.append("Your email address has been changed from ").append(oldEmail).append(" to ").append(newEmail).append(".\n\n");
		bodyBuilder.append("If you didn't make this change, please contact support immediately.\n\n");
		bodyBuilder.append("Best regards,\n");
		bodyBuilder.append("Trenvus Team");
		String body = bodyBuilder.toString();

		// Log to console
		System.out.println("========================================");
		System.out.println("EMAIL CHANGE NOTIFICATION (Console Mode)");
		System.out.println("Old email: " + oldEmail);
		System.out.println("New email: " + newEmail);
		System.out.println("Subject: " + subject);
		System.out.println("Body: " + body);
		System.out.println("========================================");
	}
}
