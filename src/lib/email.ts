import nodemailer from 'nodemailer';

type Mail = { to: string | string[]; subject: string; text: string; html?: string; replyTo?: string };

const from = () => process.env.EMAIL_FROM || 'IACEC <no-reply@iacecglobal.com>';

/**
 * Sends email through Resend (RESEND_API_KEY) or SMTP (SMTP_HOST…). With neither configured
 * the message is logged, so forms keep working in development.
 */
export async function sendMail(mail: Mail): Promise<boolean> {
  const to = Array.isArray(mail.to) ? mail.to.filter(Boolean) : [mail.to].filter(Boolean);
  if (!to.length) return false;
  const html = mail.html ?? `<pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(mail.text)}</pre>`;

  try {
    if (process.env.RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: from(), to, subject: mail.subject, text: mail.text, html, reply_to: mail.replyTo }),
      });
      if (!res.ok) throw new Error(`Resend responded ${res.status}`);
      return true;
    }
    if (process.env.SMTP_HOST) {
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
      });
      await transport.sendMail({ from: from(), to, subject: mail.subject, text: mail.text, html, replyTo: mail.replyTo });
      return true;
    }
    console.info(`[email:dev] To: ${to.join(', ')} | ${mail.subject}\n${mail.text}`);
    return true;
  } catch (err) {
    console.error('[email] failed to send', err);
    return false;
  }
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
