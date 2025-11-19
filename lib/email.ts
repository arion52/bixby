import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDigestEmail(date: string, itemCount: number) {
  if (!process.env.USER_EMAIL) {
    console.error('USER_EMAIL not set');
    return;
  }

  try {
    await resend.emails.send({
      from: 'Bixby <digest@jacyverse.tech>',
      to: process.env.USER_EMAIL,
      subject: `Your Bixby Digest for ${date}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Good Morning, Jason!</h1>
          <p>Your Bixby digest for ${date} is ready.</p>
          <p>We found <strong>${itemCount}</strong> items that match your interests today.</p>
          
          <div style="margin: 30px 0;">
            <a href="https://jacyverse.tech/digest/${date}" 
               style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              View Your Digest
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">
            <a href="https://jacyverse.tech/settings">Manage Preferences</a>
          </p>
        </div>
      `,
    });
    console.log(`Email sent to ${process.env.USER_EMAIL}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
