// backend/utils/emailService.js
// Requiere: npm install nodemailer
// Variables de entorno requeridas en .env:
//   EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
    port:   parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export async function sendRecoveryEmail(toEmail, code, userName = 'usuario') {
    const mailOptions = {
        from:    `"Too Easy 💰" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to:      toEmail,
        subject: `Tu código de verificación: ${code}`,
        html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1e2e42,#2C405B);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:3px;">TOO EASY 💸</h1>
          <p style="margin:8px 0 0;color:#B6823E;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Tu código de verificación</p>
        </td></tr>
        
        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 24px;color:#4a5568;font-size:16px;">Hola, <strong style="color:#2C405B;">${userName}</strong> 👋</p>
          <p style="margin:0 0 28px;color:#718096;font-size:15px;line-height:1.6;">
            Recibimos una solicitud para recuperar tu cuenta. Usa el siguiente código para continuar. 
            <strong>Expira en 10 minutos.</strong>
          </p>
          
          <!-- Código -->
          <div style="background:#f8fafc;border:2px dashed #6585AA;border-radius:16px;padding:28px;text-align:center;margin:0 0 28px;">
            <p style="margin:0 0 8px;color:#718096;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Código de verificación</p>
            <p style="margin:0;font-size:48px;font-weight:900;letter-spacing:12px;color:#2C405B;font-family:monospace;">${code}</p>
          </div>
          
          <p style="margin:0 0 8px;color:#e53e3e;font-size:13px;font-weight:600;">⚠️ Nunca compartas este código con nadie.</p>
          <p style="margin:0;color:#a0aec0;font-size:13px;">Si no solicitaste esto, ignora este correo. Tu cuenta está segura.</p>
        </td></tr>
        
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;color:#a0aec0;font-size:12px;">© 2025 Too Easy · Proyecto educativo · No responder este correo</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
    };

    await transporter.sendMail(mailOptions);
}