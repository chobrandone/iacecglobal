import type { ApplicationStatus } from '@prisma/client';
import { sendMail } from '@/lib/email';

type Application = { reference: string; caretakerEmail?: string | null; notifyStaff: boolean; programmeName: string; recipients: string[]; siteUrl: string };

/** Hook for SMS or WhatsApp delivery. Not used yet; add the provider here. */
async function sendCaretakerMessage(_phone: string, _message: string) {
  return false;
}

/** Emails carry only the reference number. Everything else stays in the admin. */
export async function notifyNewApplication(a: Application, caretakerPhone?: string) {
  const message = `Thank you. Your application to the ${a.programmeName} has been received. Your reference is ${a.reference}. An IACEC member will contact you to arrange a home visit.`;
  await Promise.allSettled([
    a.notifyStaff
      ? sendMail({
          to: a.recipients,
          subject: `New sponsorship application ${a.reference}`,
          text: `A new confidential application has been received: ${a.reference}.\n\nSign in to read it:\n${a.siteUrl}/admin/sponsorship`,
        })
      : Promise.resolve(false),
    a.caretakerEmail ? sendMail({ to: a.caretakerEmail, subject: `Your IACEC application ${a.reference}`, text: message }) : Promise.resolve(false),
    caretakerPhone ? sendCaretakerMessage(caretakerPhone, message) : Promise.resolve(false),
  ]);
}

const statusMessages: Partial<Record<ApplicationStatus, string>> = {
  CONTACTED: 'An IACEC member has started reviewing your application.',
  VISIT_SCHEDULED: 'An IACEC member will visit you. They will confirm the date with you.',
  VERIFIED: 'Your application has been verified. A decision will follow.',
  ACCEPTED: 'Your application has been accepted. An IACEC member will contact you about the next steps.',
  WAITING_LIST: 'Your application is on the waiting list. We will contact you when a place is available.',
  NOT_ACCEPTED: 'We are not able to accept this application at this time. Please contact IACEC if you have questions.',
  SPONSORED: 'A sponsor has been found. An IACEC member will contact you about the next steps.',
};

export async function notifyStatusChange(to: string, reference: string, status: ApplicationStatus) {
  const message = statusMessages[status];
  if (message) await sendMail({ to, subject: `Your IACEC application ${reference}`, text: `${message}\n\nYour reference is ${reference}.` });
}
