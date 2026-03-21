import type { EmailTemplateTypeKey } from './templateTypes';

export type DefaultEmailTemplate = {
  name: string;
  isDefault: true;
  templateType: EmailTemplateTypeKey;
  isArchived: false;
  subject: string;
  body: string;
};

export const DEFAULT_EMAIL_TEMPLATES: DefaultEmailTemplate[] = [
  {
    name: 'Lead Inquiry Response',
    isDefault: true,
    templateType: 'SALES_CRM',
    isArchived: false,
    subject: 'Regarding your requirement for {{company.name}}',
    body:
      'Hello {{contact.name}},\nHow are you doing?\nThis is {{my.name}} this side from {{business.name}}.\nWe have received your inquiry about the requirements you have for {{company.name}}.\nI wanted to understand these requirements better. Can you let me know what would be a good time to discuss this over a call?',
  },
  {
    name: 'Lead Follow-up Email',
    isDefault: true,
    templateType: 'SALES_CRM',
    isArchived: false,
    subject: 'Following up on your requirement for {{company.name}}',
    body:
      "Hello {{contact.name}},\n{{my.name}} here from {{business.name}}.\nI just wanted to follow up on our last conversation.\nI'm eager to know if you've had a chance to consider our discussion and if there are any further questions I can answer.\nIf it’s convenient for you, we could schedule another call to go over any specifics or concerns you might have.\nLooking forward to hearing from you.",
  },
  {
    name: 'Upcoming Meeting Reminder',
    isDefault: true,
    templateType: 'SALES_CRM',
    isArchived: false,
    subject: 'Reminder: upcoming meeting with {{company.name}}',
    body:
      'Hello {{contact.name}},\nJust a quick reminder about our upcoming meeting scheduled for _\\[Date\\]_ at _\\[Time\\]_.\nPlease let me know if this time still works for you or if any adjustments are needed.\nLooking forward to our conversation.',
  },
  {
    name: 'Missed Meeting Check-In',
    isDefault: true,
    templateType: 'SALES_CRM',
    isArchived: false,
    subject: '{{contact.name}}, should we reschedule our meeting?',
    body:
      "Hello {{contact.name}},\nI noticed that we missed our scheduled meeting. I hope everything is alright on your end.\nI understand that schedules can get busy, and I would be more than happy to find a new time that works better for you.\nPlease let me know your availability, and I'll arrange for a reschedule at your earliest convenience.\nLooking forward to hearing from you.",
  },
  {
    name: 'Share Product Details',
    isDefault: true,
    templateType: 'SALES_CRM',
    isArchived: false,
    subject: 'Our offerings for {{company.name}}',
    body:
      'Dear {{contact.name}},\nThank you for showing interest in our products at {{business.name}}.\nAt {{business.name}}, We provide products such as.....\nFor a detailed overview, you can visit \\[link to product details page or _\\[brochure\\]_.\nDo feel free to ask any questions you might have.',
  },
  {
    name: 'Feedback Request For Lost Leads',
    isDefault: true,
    templateType: 'SALES_CRM',
    isArchived: false,
    subject: 'Would you like to give any feedback?',
    body:
      "Dear {{contact.name}},\nI'm reaching out to understand more about your decision regarding our offerings.\nWhile we're disappointed that we won't be working together at this time, we genuinely value your insights.\nYour feedback about what led to your decision not to proceed with us, or any areas we could improve, would be incredibly helpful.\nThank you for considering {{business.name}}, and we hope to have the opportunity to serve {{company.name}} in the future.\nLooking forward to hearing from you.",
  },
  {
    name: 'Take The Conversation Forward',
    isDefault: true,
    templateType: 'SALES_CRM',
    isArchived: false,
    subject: 'Moving Forward: Next Steps for {{company.name}}',
    body:
      'Hello {{contact.name}},\nIt was great speaking with you about how {{business.name}} can add value to {{company.name}}.\nAs discussed, the next steps would be:\n1.  We will schedule a free demo for your team.\n2.  Understand your requirements\n3.  Send a detailed Proposal\nPlease let me know a convenient time for you to proceed or if there\'s any other information you require.',
  },
];
