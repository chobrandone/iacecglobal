import type { FormField } from '../../src/lib/forms';

// Form definitions copied from the live site's bundle: field names, labels, order, required markers,
// options, placeholders, row counts, button labels and success messages.

const name: FormField = { name: 'full_name', label: 'Your full name', type: 'text', required: true, half: true };
const email: FormField = { name: 'email', label: 'Email address', type: 'email', required: true, half: true };
const phone: FormField = { name: 'phone', label: 'Phone number', type: 'tel', half: true };

export const forms: {
  key: string;
  name: string;
  restricted?: boolean;
  sponsorship?: boolean;
  submitLabel: string;
  successTitle: string;
  successBody: string;
  note?: string;
  autoReplySubject?: string;
  autoReplyBody?: string;
  fields: FormField[];
}[] = [
  {
    key: 'training',
    name: 'Training request',
    submitLabel: 'Request a training',
    successTitle: 'Thank you — your request has been received.',
    successBody: 'Our training team will review your details and come back to you with possible dates.',
    fields: [
      name,
      email,
      phone,
      { name: 'organisation', label: 'School or church', type: 'text', required: true, half: true },
      { name: 'role_title', label: 'Your role (e.g. head teacher)', type: 'text', half: true },
      {
        name: 'programme',
        label: 'Training requested',
        type: 'select',
        half: true,
        options: [
          'Teacher Training in Biblical Integration',
          'Lifestyle Evangelism Workshop',
          'Leadership for head teachers',
          'Cluster or church-based session',
          'Not sure yet — please advise',
        ],
      },
      { name: 'preferred_date', label: 'Preferred date', type: 'date', half: true },
      { name: 'location', label: 'Town or city', type: 'text', half: true },
      { name: 'message', label: 'Tell us about your school and your needs', type: 'textarea', rows: 4 },
    ],
  },
  {
    key: 'outreach',
    name: 'Outreach invitation',
    submitLabel: 'Send invitation',
    successTitle: 'Thank you — your invitation has reached us.',
    successBody: "A member of the children's ministry team will respond to discuss dates and permissions.",
    fields: [
      name,
      email,
      phone,
      { name: 'organisation', label: 'School or church', type: 'text', required: true, half: true },
      { name: 'role_title', label: 'Your role', type: 'text', half: true },
      {
        name: 'programme',
        label: 'Outreach requested',
        type: 'select',
        half: true,
        options: [
          'Children’s Outreach in Schools',
          'Sunday School Outreach',
          'Child Safety Teaching',
          'Youth character development',
          'Not sure yet — please advise',
        ],
      },
      { name: 'preferred_date', label: 'Preferred date', type: 'date', half: true },
      { name: 'location', label: 'Town or city', type: 'text', half: true },
      { name: 'message', label: 'Tell us about the children you serve', type: 'textarea', rows: 4 },
    ],
  },
  {
    key: 'forum',
    name: 'Join the forum',
    submitLabel: 'Join the forum',
    successTitle: 'You are on the forum list.',
    successBody: 'We will contact you with the date and venue of the next Christian Parents and Teachers Forum.',
    fields: [
      name,
      email,
      phone,
      { name: 'organisation', label: 'School or church (optional)', type: 'text', half: true },
      {
        name: 'role_title',
        label: 'I am joining as',
        type: 'select',
        half: true,
        options: ['A parent', 'A caretaker', 'A teacher', 'A church children’s worker', 'Other'],
      },
      { name: 'location', label: 'Town or city', type: 'text', half: true },
      { name: 'message', label: 'Anything you would like us to know?', type: 'textarea', rows: 3 },
    ],
  },
  {
    key: 'sponsor',
    name: 'Become a sponsor',
    sponsorship: true,
    submitLabel: 'Become a sponsor',
    successTitle: 'Thank you for standing with a child.',
    successBody:
      'A sponsorship coordinator will contact you to explain how the programme works, including the follow-up and reporting you will receive.',
    fields: [
      name,
      email,
      phone,
      { name: 'location', label: 'Country and city', type: 'text', half: true },
      {
        name: 'frequency',
        label: 'How often would you like to give?',
        type: 'select',
        half: true,
        options: ['Monthly', 'Termly', 'Annually', 'One-off gift', 'Not sure yet'],
      },
      { name: 'amount', label: 'Indicative amount (optional)', type: 'text', half: true, placeholder: 'Any amount is welcome' },
      { name: 'organisation', label: 'Church or organisation (optional)', type: 'text', half: true },
      { name: 'message', label: 'Anything you would like us to know?', type: 'textarea', rows: 3 },
      {
        name: 'consent',
        label: 'I understand that child details shared with sponsors are limited to what consent and child protection allow.',
        type: 'checkbox',
        required: true,
      },
    ],
  },
  {
    key: 'child-application',
    name: 'Child sponsorship application',
    restricted: true,
    sponsorship: true,
    submitLabel: 'Submit application',
    successTitle: 'Your application has been received.',
    successBody:
      'A sponsorship coordinator will contact the caretaker using the details provided. Please allow time for review and a home visit to be arranged.',
    note: 'Submitted privately. Visible only to authorised IACEC sponsorship staff.',
    autoReplySubject: 'Your IACEC child sponsorship application',
    autoReplyBody:
      'Thank you. Your child sponsorship application has been received and will be reviewed by authorised IACEC sponsorship staff. A coordinator will contact you to arrange verification and a home visit.',
    fields: [
      { name: 'child_full_name', label: 'Child’s full name', type: 'text', required: true, half: true },
      { name: 'child_age', label: 'Child’s age', type: 'text', half: true },
      { name: 'child_gender', label: 'Child’s gender', type: 'select', half: true, options: ['Female', 'Male', 'Prefer not to say'] },
      { name: 'class_level', label: 'Class / level', type: 'text', half: true },
      { name: 'school_name', label: 'School', type: 'text', half: true },
      { name: 'location', label: 'Town or neighbourhood', type: 'text', half: true },
      { name: 'guardian_full_name', label: 'Parent or caretaker’s full name', type: 'text', required: true, half: true },
      { name: 'relationship', label: 'Relationship to the child', type: 'text', half: true },
      { name: 'guardian_phone', label: 'Caretaker’s phone number', type: 'tel', required: true, half: true },
      { name: 'guardian_email', label: 'Caretaker’s email (optional)', type: 'email', half: true },
      { name: 'family_situation', label: 'Briefly describe the family situation', type: 'textarea', rows: 3 },
      { name: 'support_needed', label: 'What support is needed most?', type: 'textarea', rows: 3 },
      {
        name: 'consent_confirmed',
        label:
          'I confirm that I am the parent or caretaker of this child, or that I have their caretaker’s permission to apply, and that the information given is true.',
        type: 'checkbox',
        required: true,
      },
    ],
  },
  {
    key: 'partnership',
    name: 'Partnership enquiry',
    submitLabel: 'Send partnership enquiry',
    successTitle: 'Thank you — your enquiry has been received.',
    successBody: 'A member of the IACEC leadership team will contact you to arrange an initial conversation.',
    fields: [
      name,
      email,
      { name: 'organisation', label: 'Organisation name', type: 'text', required: true, half: true },
      phone,
      {
        name: 'role_title',
        label: 'Type of organisation',
        type: 'select',
        half: true,
        options: ['Church', 'School', 'Company', 'Foundation', 'Individual', 'Other'],
      },
      { name: 'location', label: 'Country and city', type: 'text', half: true },
      {
        name: 'programme',
        label: 'Area of interest',
        type: 'select',
        half: true,
        options: [
          'Teacher training',
          'Children’s outreach',
          'Family programmes',
          'Child sponsorship',
          'Community outreach',
          'General partnership',
        ],
      },
      { name: 'message', label: 'What would you like to explore with IACEC?', type: 'textarea', rows: 4 },
    ],
  },
  {
    key: 'volunteer',
    name: 'Volunteer application',
    submitLabel: 'Apply to volunteer',
    successTitle: 'Thank you for offering to serve.',
    successBody: 'We will review your details and contact you when a suitable opportunity comes up. Please pray with us in the meantime.',
    fields: [
      name,
      email,
      { ...phone, required: true },
      { name: 'location', label: 'Town or city', type: 'text', half: true },
      { name: 'role_title', label: 'Your profession or role', type: 'text', half: true },
      {
        name: 'programme',
        label: 'Preferred area of service',
        type: 'select',
        half: true,
        options: ['Training support', 'Children’s outreach', 'Administration & logistics', 'Professional skills', 'Prayer & encouragement'],
      },
      {
        name: 'availability',
        label: 'Availability',
        type: 'select',
        half: true,
        options: ['Weekdays', 'Weekends', 'Occasional events only', 'Remote support', 'Flexible'],
      },
      { name: 'organisation', label: 'Church or organisation (optional)', type: 'text', half: true },
      { name: 'message', label: 'Tell us about your experience and heart for this work', type: 'textarea', rows: 4 },
      {
        name: 'consent',
        label: 'I am willing to follow IACEC’s child protection expectations when serving with children.',
        type: 'checkbox',
        required: true,
      },
    ],
  },
  {
    key: 'giving',
    name: 'Giving details',
    submitLabel: 'Send giving details',
    successTitle: 'Thank you — we have your giving interest.',
    successBody: 'A member of the IACEC team will contact you with the correct giving details and confirm how your gift will be used.',
    fields: [
      name,
      email,
      phone,
      { name: 'location', label: 'Country and city', type: 'text', half: true },
      {
        name: 'programme',
        label: 'Area you would like to support',
        type: 'select',
        half: true,
        options: ['General Support', 'Child Sponsorship', 'Teacher Training', 'Children’s Outreach', 'Family Programmes', 'Community Outreach'],
      },
      { name: 'frequency', label: 'Frequency', type: 'select', half: true, options: ['One-off gift', 'Monthly', 'Quarterly', 'Annually', 'Not sure yet'] },
      { name: 'amount', label: 'Indicative amount (optional)', type: 'text', half: true, placeholder: 'Any amount is welcome' },
      { name: 'organisation', label: 'Church or organisation (optional)', type: 'text', half: true },
      { name: 'message', label: 'Anything else we should know?', type: 'textarea', rows: 3 },
    ],
  },
  {
    key: 'contact',
    name: 'Contact',
    submitLabel: 'Send message',
    successTitle: 'Your message has been sent.',
    successBody: 'Thank you for writing to IACEC. We will respond using the contact details you provided.',
    fields: [
      name,
      email,
      phone,
      {
        name: 'subject',
        label: 'Reason for contact',
        type: 'select',
        half: true,
        options: [
          'General enquiry',
          'Programme enquiry',
          'Sponsorship',
          'Volunteering',
          'Partnership',
          'Event registration',
          'Media or press',
          'Other',
        ],
      },
      { name: 'organisation', label: 'School, church or organisation (optional)', type: 'text', half: true },
      { name: 'location', label: 'Country and city', type: 'text', half: true },
      { name: 'message', label: 'Your message', type: 'textarea', required: true, rows: 5 },
    ],
  },
];
