package trenvus.Exchange.email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import java.util.Properties;

@Service
public class EmailService {

	@Value("${APP_BASE_URL:http://localhost:3000}")
	private String appBaseUrl;

	@Value("${SMTP_HOST:}")
	private String smtpHost;

	@Value("${SMTP_PORT:587}")
	private int smtpPort;

	@Value("${SMTP_USERNAME:}")
	private String smtpUsername;

	@Value("${SMTP_PASSWORD:}")
	private String smtpPassword;

	@Value("${SMTP_FROM:noreply@trenvus.com}")
	private String fromEmail;

	@Value("${SMTP_ENABLED:false}")
	private boolean smtpEnabled;

	private JavaMailSender mailSender;

	private JavaMailSender getMailSender() {
		if (mailSender == null && smtpEnabled && !smtpHost.isBlank()) {
			JavaMailSenderImpl sender = new JavaMailSenderImpl();
			sender.setHost(smtpHost);
			sender.setPort(smtpPort);
			sender.setUsername(smtpUsername);
			sender.setPassword(smtpPassword);

			Properties props = sender.getJavaMailProperties();
			props.put("mail.transport.protocol", "smtp");
			props.put("mail.smtp.auth", "true");
			props.put("mail.smtp.starttls.enable", "true");
			props.put("mail.debug", "false");

			mailSender = sender;
		}
		return mailSender;
	}

	public void sendVerificationEmail(String toEmail, String token, String tokenType) {
		String subject = tokenType.equals("REGISTRATION")
				? "Confirm your registration"
				: "Confirm your email change";

		String verificationUrl = appBaseUrl + "/verify-email?token=" + token;

		String body = String.format("""
			Hello,

			%s

			Please click the link below to verify your email:
			%s

			This link will expire in 24 hours.

			If you didn't request this, please ignore this email.

			Best regards,
			Trenvus Team
			"",
			tokenType.equals("REGISTRATION") ? "Thank you for registering!" : "You requested to change your email.",
			verificationUrl
		);

		// Try to send via SMTP if configured
		JavaMailSender sender = getMailSender();
		if (sender != null) {
			try {
				SimpleMailMessage message = new SimpleMailMessage();
				message.setFrom(fromEmail);
				message.setTo(toEmail);
				message.setSubject(subject);
				message.setText(body);
				sender.send(message);
				System.out.println("Email sent successfully to: " + toEmail);
				return;
			} catch (Exception e) {
				System.err.println("Failed to send email via SMTP: " + e.getMessage());
			}
		}

		// Fallback: log to console
		System.out.println("========================================");
		System.out.println("EMAIL (SMTP not configured, logging to console)");
		System.out.println("TO: " + toEmail);
		System.out.println("FROM: " + fromEmail);
		System.out.println("SUBJECT: " + subject);
		System.out.println("BODY:");
		System.out.println(body);
		System.out.println("========================================");
	}

	public void sendEmailChangedNotification(String oldEmail, String newEmail) {
		String subject = "Your email has been changed";
		String body = String.format("""
			Hello,

			Your email address has been changed from %s to %s.

			If you didn't make this change, please contact support immediately.

			Best regards,
			Trenvus Team
			""", oldEmail, newEmail);

		// Try to send via SMTP if configured
		JavaMailSender sender = getMailSender();
		if (sender != null && oldEmail != null && !oldEmail.isBlank()) {
			try {
				SimpleMailMessage message = new SimpleMailMessage();
				message.setFrom(fromEmail);
				message.setTo(oldEmail);
				message.setSubject(subject);
				message.setText(body);
				sender.send(message);
				System.out.println("Notification email sent to old address: " + oldEmail);
				return;
			} catch (Exception e) {
				System.err.println("Failed to send notification via SMTP: " + e.getMessage());
			}
		}

		// Fallback: log to console
		System.out.println("========================================");
		System.out.println("EMAIL CHANGE NOTIFICATION (SMTP not configured)");
		System.out.println("Old email: " + oldEmail);
		System.out.println("New email: " + newEmail);
		System.out.println("========================================");
	}
}
