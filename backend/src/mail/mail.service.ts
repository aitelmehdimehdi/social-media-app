// Gmail SMTP setup:
// 1. Enable 2-Step Verification on your Google account
// 2. Go to myaccount.google.com → Security → App passwords
// 3. Generate an app password for "Mail"
// 4. Use that 16-char password as MAIL_PASS in .env
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_PASS');

    if (!user || !pass) {
      this.logger.warn('MAIL_USER or MAIL_PASS not set — emails will not be sent');
    }

    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    });
  }

  async sendResetCode(to: string, code: string): Promise<void> {
    const from = `"Sharely" <${this.config.get<string>('MAIL_USER')}>`;

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F5F0FF;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0FF;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:20px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(124,58,237,0.10);">

          <!-- Header -->
          <tr>
            <td align="center"
                style="background:linear-gradient(135deg,#7C3AED,#9F67F5);
                       padding:36px 40px 28px;">
              <h1 style="margin:0;color:#ffffff;font-size:32px;
                         font-weight:800;letter-spacing:2px;">Sharely</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.80);font-size:14px;">
                Réinitialisation de mot de passe
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:16px;color:#1A1A1A;font-weight:600;">
                Bonjour,
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#555;line-height:22px;">
                Vous avez demandé à réinitialiser votre mot de passe Sharely.
                Utilisez le code ci-dessous — il est valable pendant <strong>10 minutes</strong>.
              </p>

              <!-- OTP box -->
              <div style="background:#F5F0FF;border:2px solid #D8C8FF;border-radius:16px;
                          padding:28px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:12px;color:#7C3AED;
                           font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                  Votre code de vérification
                </p>
                <p style="margin:0;font-size:44px;font-weight:800;color:#7C3AED;
                           letter-spacing:14px;font-family:monospace;">
                  ${code}
                </p>
              </div>

              <p style="margin:0 0 8px;font-size:13px;color:#888;line-height:20px;">
                Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email —
                votre mot de passe restera inchangé.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#FAFAFA;border-top:1px solid #F0E8FF;
                       padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaa;">
                © 2025 Sharely · Cet email a été envoyé automatiquement, ne pas répondre.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await this.transporter.sendMail({
      from,
      to,
      subject: 'Sharely — Code de vérification',
      html,
    });

    this.logger.log(`Reset code sent to ${to}`);
  }
}
