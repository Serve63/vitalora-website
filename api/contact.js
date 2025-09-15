export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { name, email, message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const nodemailer = require('nodemailer');

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 465);
    const secure = String(process.env.SMTP_SECURE || 'true') === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.log('SMTP env vars missing, logging contact form submission:', { name, email, message });
      return res.status(200).json({ success: true, message: 'Bericht succesvol verzonden (logged)' });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });

    const fromAddress = process.env.SMTP_FROM || user || 'info@vitalora.nl';

    const subject = `Contact formulier van ${name}`;
    const text = `Nieuw contact formulier bericht\n\nNaam: ${name}\nE-mail: ${email}\nBericht: ${message}\n\nDit bericht is verzonden via het contact formulier op vitalora.nl`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #10B981; padding-bottom: 10px;">Nieuw contact formulier bericht</h2>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>Naam:</strong> ${name}</p>
          <p style="margin: 10px 0;"><strong>E-mail:</strong> ${email}</p>
          <p style="margin: 10px 0;"><strong>Bericht:</strong></p>
          <div style="background: #fff; padding: 15px; border-radius: 4px; border-left: 4px solid #10B981; white-space: pre-wrap;">${String(message || '').replace(/\n/g, '<br>')}</div>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;"><em>Dit bericht is verzonden via het contact formulier op vitalora.nl</em></p>
      </div>
    `;

    await transporter.sendMail({
      from: `Vitalora.nl <${fromAddress}>`,
      to: 'info@vitalora.nl',
      replyTo: email,
      subject,
      text,
      html
    });

    res.status(200).json({ success: true, message: 'Bericht succesvol verzonden' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Er is een fout opgetreden bij het verzenden van je bericht' });
  }
}
