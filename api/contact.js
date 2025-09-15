export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Send email using SendGrid
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const emailData = {
      to: 'info@vitalora.nl',
      from: 'noreply@vitalora.nl', // Make sure this is verified in SendGrid
      subject: `Contact formulier van ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #10B981; padding-bottom: 10px;">Nieuw contact formulier bericht</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Naam:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong>E-mail:</strong> ${email}</p>
            <p style="margin: 10px 0;"><strong>Bericht:</strong></p>
            <div style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #10B981;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            <em>Dit bericht is verzonden via het contact formulier op vitalora.nl</em>
          </p>
        </div>
      `,
      text: `
Nieuw contact formulier bericht

Naam: ${name}
E-mail: ${email}
Bericht: ${message}

Dit bericht is verzonden via het contact formulier op vitalora.nl
      `
    };

    // Send the email
    await sgMail.send(emailData);
    
    console.log('Contact form email sent successfully:', { name, email });
    
    res.status(200).json({ 
      success: true, 
      message: 'Bericht succesvol verzonden' 
    });

  } catch (error) {
    console.error('Contact form error:', error);
    
    // If SendGrid is not configured, fall back to logging
    if (error.code === 401 || error.message?.includes('API key')) {
      console.log('SendGrid not configured, logging contact form submission:', {
        name: req.body.name,
        email: req.body.email,
        message: req.body.message
      });
      
      res.status(200).json({ 
        success: true, 
        message: 'Bericht succesvol verzonden (logged)' 
      });
    } else {
      res.status(500).json({ 
        error: 'Er is een fout opgetreden bij het verzenden van je bericht' 
      });
    }
  }
}
