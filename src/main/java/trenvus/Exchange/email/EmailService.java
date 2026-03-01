package trenvus.Exchange.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${SMTP_FROM:noreply@trenvus.com}")
    private String fromEmail;

    @Value("${APP_BASE_URL:http://localhost:3000}")
    private String appBaseUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendRegistrationConfirmation(String toEmail, String token) throws MessagingException, UnsupportedEncodingException {
        String subject = "Confirme seu cadastro - Trenvus";
        String confirmationUrl = appBaseUrl + "/confirm-registration?token=" + token;
        String htmlContent = buildRegistrationEmail(confirmationUrl);
        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    public void sendAccountDeletionConfirmation(String toEmail, String token) throws MessagingException, UnsupportedEncodingException {
        String subject = "Confirme a exclusao da sua conta - Trenvus";
        String confirmationUrl = appBaseUrl + "/confirm-deletion?token=" + token;
        String htmlContent = buildDeletionEmail(confirmationUrl);
        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    private void sendHtmlEmail(String toEmail, String subject, String htmlContent) throws MessagingException, UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromEmail, "Trenvus - Equipe de Seguranca");
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        mailSender.send(message);
    }

    private String buildRegistrationEmail(String confirmationUrl) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html>\n");
        sb.append("<html lang=\"pt-BR\">\n");
        sb.append("<head>\n");
        sb.append("<meta charset=\"UTF-8\">\n");
        sb.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n");
        sb.append("<title>Confirme seu cadastro - Trenvus</title>\n");
        sb.append("<style>\n");
        sb.append("* { margin: 0; padding: 0; box-sizing: border-box; }\n");
        sb.append("body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333; }\n");
        sb.append(".container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }\n");
        sb.append(".header { background: linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%); padding: 40px 20px; text-align: center; }\n");
        sb.append(".logo { font-size: 32px; font-weight: bold; color: #ffffff; letter-spacing: 2px; }\n");
        sb.append(".content { padding: 40px 30px; }\n");
        sb.append(".title { font-size: 24px; color: #1a1a2e; margin-bottom: 20px; font-weight: 600; }\n");
        sb.append(".text { font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 20px; }\n");
        sb.append(".button-container { text-align: center; margin: 30px 0; }\n");
        sb.append(".button { display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3); }\n");
        sb.append(".link-box { background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin: 20px 0; word-break: break-all; }\n");
        sb.append(".link-box a { color: #7C3AED; text-decoration: none; font-size: 14px; }\n");
        sb.append(".footer { background-color: #1a1a2e; color: #888; padding: 30px; text-align: center; font-size: 14px; }\n");
        sb.append(".divider { height: 1px; background-color: #e9ecef; margin: 30px 0; }\n");
        sb.append(".security-notice { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }\n");
        sb.append(".security-notice strong { color: #856404; }\n");
        sb.append("</style>\n");
        sb.append("</head>\n");
        sb.append("<body>\n");
        sb.append("<div class=\"container\">\n");
        sb.append("<div class=\"header\">\n");
        sb.append("<div class=\"logo\">TRENVUS</div>\n");
        sb.append("</div>\n");
        sb.append("<div class=\"content\">\n");
        sb.append("<h1 class=\"title\">Bem-vindo a Trenvus!</h1>\n");
        sb.append("<p class=\"text\">Ola,</p>\n");
        sb.append("<p class=\"text\">Estamos muito felizes em ter voce conosco! Para completar seu cadastro e comecar a usar nossa plataforma de cambio de criptomoedas, precisamos confirmar seu endereco de e-mail.</p>\n");
        sb.append("<div class=\"button-container\">\n");
        sb.append("<a href=\"").append(confirmationUrl).append("\" class=\"button\">Confirmar meu cadastro</a>\n");
        sb.append("</div>\n");
        sb.append("<p class=\"text\" style=\"text-align: center; font-size: 14px; color: #888;\">Ou copie e cole o link abaixo no seu navegador:</p>\n");
        sb.append("<div class=\"link-box\">\n");
        sb.append("<a href=\"").append(confirmationUrl).append("\">").append(confirmationUrl).append("</a>\n");
        sb.append("</div>\n");
        sb.append("<div class=\"security-notice\">\n");
        sb.append("<strong>Importante:</strong> Este link expira em 24 horas por motivos de seguranca. Se voce nao solicitou este cadastro, por favor ignore este e-mail.\n");
        sb.append("</div>\n");
        sb.append("<div class=\"divider\"></div>\n");
        sb.append("<p class=\"text\" style=\"font-size: 14px; color: #666;\">\n");
        sb.append("<strong>Precisa de ajuda?</strong><br>\n");
        sb.append("Entre em contato com nossa equipe de suporte atraves do e-mail <a href=\"mailto:suporte@trenvus.com\" style=\"color: #7C3AED;\">suporte@trenvus.com</a>\n");
        sb.append("</p>\n");
        sb.append("</div>\n");
        sb.append("<div class=\"footer\">\n");
        sb.append("<p>2024 Trenvus. Todos os direitos reservados.</p>\n");
        sb.append("<p style=\"margin-top: 10px;\">Este e um e-mail automatico, por favor nao responda.</p>\n");
        sb.append("</div>\n");
        sb.append("</div>\n");
        sb.append("</body>\n");
        sb.append("</html>");
        return sb.toString();
    }

    private String buildDeletionEmail(String confirmationUrl) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html>\n");
        sb.append("<html lang=\"pt-BR\">\n");
        sb.append("<head>\n");
        sb.append("<meta charset=\"UTF-8\">\n");
        sb.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n");
        sb.append("<title>Confirme a exclusao da sua conta - Trenvus</title>\n");
        sb.append("<style>\n");
        sb.append("* { margin: 0; padding: 0; box-sizing: border-box; }\n");
        sb.append("body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333; }\n");
        sb.append(".container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }\n");
        sb.append(".header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 20px; text-align: center; }\n");
        sb.append(".logo { font-size: 32px; font-weight: bold; color: #ffffff; letter-spacing: 2px; }\n");
        sb.append(".content { padding: 40px 30px; }\n");
        sb.append(".title { font-size: 24px; color: #dc3545; margin-bottom: 20px; font-weight: 600; }\n");
        sb.append(".text { font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 20px; }\n");
        sb.append(".warning-box { background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin: 20px 0; }\n");
        sb.append(".warning-box h3 { color: #721c24; margin-bottom: 10px; }\n");
        sb.append(".warning-box ul { color: #721c24; margin-left: 20px; }\n");
        sb.append(".warning-box li { margin: 5px 0; }\n");
        sb.append(".button-container { text-align: center; margin: 30px 0; }\n");
        sb.append(".button-delete { display: inline-block; background-color: #dc3545; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; }\n");
        sb.append(".link-box { background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin: 20px 0; word-break: break-all; }\n");
        sb.append(".link-box a { color: #dc3545; text-decoration: none; font-size: 14px; }\n");
        sb.append(".footer { background-color: #1a1a2e; color: #888; padding: 30px; text-align: center; font-size: 14px; }\n");
        sb.append(".divider { height: 1px; background-color: #e9ecef; margin: 30px 0; }\n");
        sb.append("</style>\n");
        sb.append("</head>\n");
        sb.append("<body>\n");
        sb.append("<div class=\"container\">\n");
        sb.append("<div class=\"header\">\n");
        sb.append("<div class=\"logo\">TRENVUS</div>\n");
        sb.append("</div>\n");
        sb.append("<div class=\"content\">\n");
        sb.append("<h1 class=\"title\">Confirmacao de Exclusao de Conta</h1>\n");
        sb.append("<p class=\"text\">Ola,</p>\n");
        sb.append("<p class=\"text\">Recebemos uma solicitacao para excluir permanentemente sua conta na Trenvus. Esta acao <strong>nao pode ser desfeita</strong>.</p>\n");
        sb.append("<div class=\"warning-box\">\n");
        sb.append("<h3>Ao confirmar a exclusao, voce perdera:</h3>\n");
        sb.append("<ul>\n");
        sb.append("<li>Acesso a todos os seus saldos e carteiras</li>\n");
        sb.append("<li>Historico completo de transacoes</li>\n");
        sb.append("<li>Dados pessoais e configuracoes da conta</li>\n");
        sb.append("<li>Qualquer beneficio ou programa de fidelidade ativo</li>\n");
        sb.append("</ul>\n");
        sb.append("</div>\n");
        sb.append("<p class=\"text\" style=\"text-align: center; font-weight: 600; color: #dc3545;\">Tem certeza que deseja prosseguir?</p>\n");
        sb.append("<div class=\"button-container\">\n");
        sb.append("<a href=\"").append(confirmationUrl).append("\" class=\"button-delete\">Sim, excluir minha conta</a>\n");
        sb.append("</div>\n");
        sb.append("<p class=\"text\" style=\"text-align: center; font-size: 14px; color: #888;\">Ou copie e cole o link abaixo:</p>\n");
        sb.append("<div class=\"link-box\">\n");
        sb.append("<a href=\"").append(confirmationUrl).append("\">").append(confirmationUrl).append("</a>\n");
        sb.append("</div>\n");
        sb.append("<div class=\"divider\"></div>\n");
        sb.append("<p class=\"text\" style=\"font-size: 14px; color: #666;\">\n");
        sb.append("<strong>Nao solicitou esta exclusao?</strong><br>\n");
        sb.append("Se voce nao solicitou a exclusao da sua conta, por favor ignore este e-mail e <a href=\"mailto:suporte@trenvus.com\" style=\"color: #7C3AED;\">entre em contato com nosso suporte</a> imediatamente.\n");
        sb.append("</p>\n");
        sb.append("<p class=\"text\" style=\"font-size: 14px; color: #888; text-align: center; margin-top: 30px;\">\n");
        sb.append("Este link expira em 1 hora por motivos de seguranca.\n");
        sb.append("</p>\n");
        sb.append("</div>\n");
        sb.append("<div class=\"footer\">\n");
        sb.append("<p>2024 Trenvus. Todos os direitos reservados.</p>\n");
        sb.append("<p style=\"margin-top: 10px;\">Este e um e-mail automatico, por favor nao responda.</p>\n");
        sb.append("</div>\n");
        sb.append("</div>\n");
        sb.append("</body>\n");
        sb.append("</html>");
        return sb.toString();
    }
}
