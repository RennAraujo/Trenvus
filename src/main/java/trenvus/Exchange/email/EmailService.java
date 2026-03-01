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
        String subject = "Confirme a exclusão da sua conta - Trenvus";
        String confirmationUrl = appBaseUrl + "/confirm-deletion?token=" + token;

        String htmlContent = buildDeletionEmail(confirmationUrl);

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    private void sendHtmlEmail(String toEmail, String subject, String htmlContent) throws MessagingException, UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail, "Trenvus - Equipe de Segurança");
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(message);
    }

    private String buildRegistrationEmail(String confirmationUrl) {
        return """
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Confirme seu cadastro - Trenvus</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
                    .header { background: linear-gradient(135deg, #7C3AED 0%%, #EA1D2C 100%%); padding: 40px 20px; text-align: center; }
                    .logo { font-size: 32px; font-weight: bold; color: #ffffff; letter-spacing: 2px; }
                    .content { padding: 40px 30px; }
                    .title { font-size: 24px; color: #1a1a2e; margin-bottom: 20px; font-weight: 600; }
                    .text { font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 20px; }
                    .button-container { text-align: center; margin: 30px 0; }
                    .button { display: inline-block; background: linear-gradient(135deg, #7C3AED 0%%, #EA1D2C 100%%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3); }
                    .button:hover { box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4); }
                    .link-box { background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin: 20px 0; word-break: break-all; }
                    .link-box a { color: #7C3AED; text-decoration: none; font-size: 14px; }
                    .footer { background-color: #1a1a2e; color: #888; padding: 30px; text-align: center; font-size: 14px; }
                    .footer a { color: #7C3AED; text-decoration: none; }
                    .divider { height: 1px; background-color: #e9ecef; margin: 30px 0; }
                    .security-notice { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .security-notice strong { color: #856404; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">TRENVUS</div>
                    </div>
                    
                    <div class="content">
                        <h1 class="title">Bem-vindo à Trenvus!</h1>
                        
                        <p class="text">Olá,</p>
                        
                        <p class="text">Estamos muito felizes em ter você conosco! Para completar seu cadastro e começar a usar nossa plataforma de câmbio de criptomoedas, precisamos confirmar seu endereço de e-mail.</p>
                        
                        <div class="button-container">
                            <a href=""" + confirmationUrl + """ class="button">Confirmar meu cadastro</a>
                        </div>
                        
                        <p class="text" style="text-align: center; font-size: 14px; color: #888;">Ou copie e cole o link abaixo no seu navegador:</p>
                        
                        <div class="link-box">
                            <a href=""" + confirmationUrl + """>""" + confirmationUrl + """</a>
                        </div>
                        
                        <div class="security-notice">
                            <strong>🔒 Importante:</strong> Este link expira em 24 horas por motivos de segurança. Se você não solicitou este cadastro, por favor ignore este e-mail.
                        </div>
                        
                        <div class="divider"></div>
                        
                        <p class="text" style="font-size: 14px; color: #666;">
                            <strong>Precisa de ajuda?</strong><br>
                            Entre em contato com nossa equipe de suporte através do e-mail <a href="mailto:suporte@trenvus.com" style="color: #7C3AED;">suporte@trenvus.com</a>
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>© 2024 Trenvus. Todos os direitos reservados.</p>
                        <p style="margin-top: 10px;">Este é um e-mail automático, por favor não responda.</p>
                    </div>
                </div>
            </body>
            </html>
            """;
    }

    private String buildDeletionEmail(String confirmationUrl) {
        return """
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Confirme a exclusão da sua conta - Trenvus</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
                    .header { background: linear-gradient(135deg, #dc3545 0%%, #c82333 100%%); padding: 40px 20px; text-align: center; }
                    .logo { font-size: 32px; font-weight: bold; color: #ffffff; letter-spacing: 2px; }
                    .content { padding: 40px 30px; }
                    .title { font-size: 24px; color: #dc3545; margin-bottom: 20px; font-weight: 600; }
                    .text { font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 20px; }
                    .warning-box { background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin: 20px 0; }
                    .warning-box h3 { color: #721c24; margin-bottom: 10px; }
                    .warning-box ul { color: #721c24; margin-left: 20px; }
                    .warning-box li { margin: 5px 0; }
                    .button-container { text-align: center; margin: 30px 0; }
                    .button-delete { display: inline-block; background-color: #dc3545; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; }
                    .button-delete:hover { background-color: #c82333; }
                    .button-cancel { display: inline-block; background-color: #6c757d; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-size: 14px; margin-left: 10px; }
                    .link-box { background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin: 20px 0; word-break: break-all; }
                    .link-box a { color: #dc3545; text-decoration: none; font-size: 14px; }
                    .footer { background-color: #1a1a2e; color: #888; padding: 30px; text-align: center; font-size: 14px; }
                    .divider { height: 1px; background-color: #e9ecef; margin: 30px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">TRENVUS</div>
                    </div>
                    
                    <div class="content">
                        <h1 class="title">⚠️ Confirmação de Exclusão de Conta</h1>
                        
                        <p class="text">Olá,</p>
                        
                        <p class="text">Recebemos uma solicitação para excluir permanentemente sua conta na Trenvus. Esta ação <strong>não pode ser desfeita</strong>.</p>
                        
                        <div class="warning-box">
                            <h3>Ao confirmar a exclusão, você perderá:</h3>
                            <ul>
                                <li>Acesso a todos os seus saldos e carteiras</li>
                                <li>Histórico completo de transações</li>
                                <li>Dados pessoais e configurações da conta</li>
                                <li>Qualquer benefício ou programa de fidelidade ativo</li>
                            </ul>
                        </div>
                        
                        <p class="text" style="text-align: center; font-weight: 600; color: #dc3545;">Tem certeza que deseja prosseguir?</p>
                        
                        <div class="button-container">
                            <a href=""" + confirmationUrl + """ class="button-delete">Sim, excluir minha conta</a>
                        </div>
                        
                        <p class="text" style="text-align: center; font-size: 14px; color: #888;">Ou copie e cole o link abaixo:</p>
                        
                        <div class="link-box">
                            <a href=""" + confirmationUrl + """>""" + confirmationUrl + """</a>
                        </div>
                        
                        <div class="divider"></div>
                        
                        <p class="text" style="font-size: 14px; color: #666;">
                            <strong>Não solicitou esta exclusão?</strong><br>
                            Se você não solicitou a exclusão da sua conta, por favor ignore este e-mail e <a href="mailto:suporte@trenvus.com" style="color: #7C3AED;">entre em contato com nosso suporte</a> imediatamente.
                        </p>
                        
                        <p class="text" style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
                            Este link expira em 1 hora por motivos de segurança.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>© 2024 Trenvus. Todos os direitos reservados.</p>
                        <p style="margin-top: 10px;">Este é um e-mail automático, por favor não responda.</p>
                    </div>
                </div>
            </body>
            </html>
            """;
    }
}
