package com.verifyauth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${app.mail-from}")
    private String mailFrom;

    @Async
    public void sendVerificationEmail(String toEmail, String token, String firstName, boolean isBrand) {
        try {
            String verifyUrl = baseUrl + "/verify-email?token=" + token;
            String accountType = isBrand ? "Brand" : "Customer";

            String subject = "Activate Your " + accountType + " Account - check-original.com";
            String htmlContent = buildVerificationEmailHtml(firstName, verifyUrl, accountType);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Verification email sent to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send verification email to: {}", toEmail, e);
        }
    }

    @Async
    public void sendActivationConfirmationEmail(String toEmail, String firstName, boolean isBrand) {
        try {
            String loginUrl = isBrand ? baseUrl + "/?tab=brand" : baseUrl;
            String accountType = isBrand ? "Brand" : "Customer";

            String subject = "Account Activated - check-original.com";
            String htmlContent = buildActivationConfirmationHtml(firstName, loginUrl, accountType);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Activation confirmation email sent to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send activation confirmation email to: {}", toEmail, e);
        }
    }

    @Async
    public void sendTempPasswordEmail(String toEmail, String firstName, String tempPassword, boolean isBrand) {
        try {
            String subject = "Temporary Password - check-original.com";
            String htmlContent = buildTempPasswordEmailHtml(firstName, tempPassword, isBrand);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Temporary password email sent to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send temporary password email to: {}", toEmail, e);
        }
    }

    private String buildTempPasswordEmailHtml(String firstName, String tempPassword, boolean isBrand) {
        String loginUrl = isBrand ? baseUrl + "/brand" : baseUrl;
        String accountType = isBrand ? "Brand" : "Customer";
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa;">
              <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background: #dc2626; padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">check-original.com</h1>
                  <p style="color: #fecaca; margin: 8px 0 0 0; font-size: 14px;">Password Reset Notification</p>
                </div>
                <div style="padding: 30px;">
                  <h2 style="color: #1e293b; margin-top: 0;">Hi %s,</h2>
                  <p style="color: #475569; line-height: 1.6;">Your <strong>%s</strong> account password on <strong>check-original.com</strong> has been reset by the system administrator. A temporary password has been generated for you.</p>
                  <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
                    <p style="color: #991b1b; margin: 0 0 8px 0; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Your Temporary Password</p>
                    <p style="color: #dc2626; margin: 0; font-size: 28px; font-weight: bold; font-family: monospace; letter-spacing: 3px;">%s</p>
                  </div>
                  <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 0 6px 6px 0;">
                    <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: bold;">Important:</p>
                    <ul style="color: #92400e; margin: 8px 0 0 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">
                      <li>Please log in using this temporary password and change it immediately.</li>
                      <li>Do not share this password with anyone.</li>
                      <li>If you did not request this reset, please contact support immediately.</li>
                    </ul>
                  </div>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="%s" style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Log In to Your Account</a>
                  </div>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                  <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated message from check-original.com. Please do not reply to this email.</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(
                firstName != null ? firstName : "User",
                accountType,
                tempPassword,
                loginUrl
            );
    }

    private String buildVerificationEmailHtml(String firstName, String verifyUrl, String accountType) {
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa;">
              <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background: #2563eb; padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">check-original.com</h1>
                  <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 14px;">Product Authentication System</p>
                </div>
                <div style="padding: 30px;">
                  <h2 style="color: #1e293b; margin-top: 0;">Welcome, %s!</h2>
                  <p style="color: #475569; line-height: 1.6;">Thank you for registering your <strong>%s</strong> account with check-original.com. To complete your registration and activate your account, please click the button below:</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="%s" style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Activate My Account</a>
                  </div>
                  <p style="color: #64748b; font-size: 13px; line-height: 1.5;">If the button doesn't work, copy and paste this link into your browser:</p>
                  <p style="color: #2563eb; font-size: 12px; word-break: break-all;">%s</p>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                  <p style="color: #94a3b8; font-size: 12px;">This activation link will expire in 24 hours. If you did not create this account, please ignore this email.</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(firstName != null ? firstName : "User", accountType, verifyUrl, verifyUrl);
    }

    private String buildActivationConfirmationHtml(String firstName, String loginUrl, String accountType) {
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa;">
              <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background: #16a34a; padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">Account Activated!</h1>
                </div>
                <div style="padding: 30px;">
                  <h2 style="color: #1e293b; margin-top: 0;">Hi %s,</h2>
                  <p style="color: #475569; line-height: 1.6;">Your <strong>%s</strong> account has been successfully activated. You can now log in and start using check-original.com.</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="%s" style="display: inline-block; background: #16a34a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Go to Login</a>
                  </div>
                </div>
              </div>
            </body>
            </html>
            """.formatted(firstName != null ? firstName : "User", accountType, loginUrl);
    }
}
