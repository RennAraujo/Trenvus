package trenvus.Exchange.email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

	@Value("${APP_BASE_URL:http://localhost:3000}")
	private String appBaseUrl;

	public void sendVerificationEmail(String toEmail, String token, String tokenType) {
		String subject = tokenType.equals("REGISTRATION") 
			? "Confirm your registration" 
			: "Confirm your email change";
		
		String verificationUrl = appBaseUrl + "/verify-email?token=" + token;
		
		// For now, just log the email (in production, integrate with SendGrid, AWS SES, etc.)
		System.out.println("========================================");
		System.out.println("EMAIL SENT TO: " + toEmail);
		System.out.println("SUBJECT: " + subject);
		System.out.println("VERIFICATION LINK: " + verificationUrl);
		System.out.println("========================================");
	}

	public void sendEmailChangedNotification(String oldEmail, String newEmail) {
		System.out.println("========================================");
		System.out.println("EMAIL CHANGE NOTIFICATION");
		System.out.println("Old email: " + oldEmail);
		System.out.println("New email: " + newEmail);
		System.out.println("========================================");
	}
}
