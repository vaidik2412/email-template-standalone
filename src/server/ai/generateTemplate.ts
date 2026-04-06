import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicApiKey } from '../config';
import { buildTemplateVariableCatalog } from '@/data/email/templateVariables';
import { ENABLED_EMAIL_TEMPLATE_TYPE_KEYS, EMAIL_TEMPLATE_TYPES } from '@/data/email/templateTypes';
import type { EmailTemplateTypeKey } from '@/data/email/templateTypes';
import {
  ACCOUNTING_DOCUMENT_SUBTYPES,
  ACCOUNTING_DOCUMENT_SUBTYPE_KEYS,
  type DocumentTemplateSubtypeKey,
} from '@/data/email/documentSubtypes';

export type GenerateTemplateInput = {
  description: string;
};

export type GenerateTemplateResult = {
  name: string;
  subject: string;
  body: string;
  signature?: string;
  channel: 'EMAIL' | 'WHATSAPP';
  templateType: EmailTemplateTypeKey;
  documentSubtype?: DocumentTemplateSubtypeKey;
};

function buildCategoryReference() {
  const categories = ENABLED_EMAIL_TEMPLATE_TYPE_KEYS
    .map((key) => `- "${key}" — ${EMAIL_TEMPLATE_TYPES[key].label}`)
    .join('\n');

  const subtypes = ACCOUNTING_DOCUMENT_SUBTYPE_KEYS
    .map((key) => `- "${key}" — ${ACCOUNTING_DOCUMENT_SUBTYPES[key].label}${ACCOUNTING_DOCUMENT_SUBTYPES[key].supportsPaymentStatus ? ' (supports payment status: amount_paid, amount_due)' : ''}`)
    .join('\n');

  return { categories, subtypes };
}

function buildAllVariableReferences() {
  const crmVars = buildTemplateVariableCatalog({ templateType: 'SALES_CRM' })
    .options
    .map((option) => `- {{${option.value}}} — ${option.label}${option.bodyOnly ? ' (body only, email only)' : ''}`)
    .join('\n');

  const docVars = buildTemplateVariableCatalog({ templateType: 'ACCOUNTING_DOCUMENTS', documentSubtype: 'INVOICE' })
    .options
    .map((option) => `- {{${option.value}}} — ${option.label}${option.bodyOnly ? ' (body only, email only)' : ''}`)
    .join('\n');

  return { crmVars, docVars };
}

export async function generateTemplate(input: GenerateTemplateInput): Promise<GenerateTemplateResult> {
  const apiKey = getAnthropicApiKey();
  const client = new Anthropic({ apiKey });

  const { categories, subtypes } = buildCategoryReference();
  const { crmVars, docVars } = buildAllVariableReferences();

  const systemPrompt = `You are an expert email/message template writer for a business communication platform called Refrens.

Your job is to generate professional message templates based on a user's description.

## Step 1: Determine the Channel
- Default to "EMAIL" unless the user explicitly mentions "WhatsApp", "whatsapp", or "WA" in their description.
- Only pick "WHATSAPP" when the user clearly asks for a WhatsApp template.

## Step 2: Determine the Category
Based on the user's description, pick the correct category and (if applicable) document subtype.

Available categories:
${categories}

If templateType is "ACCOUNTING_DOCUMENTS", also pick one document subtype:
${subtypes}

## Step 2: Generate the Template
Use ONLY the variable tokens from the matching category below.

### Sales CRM Variables (use when templateType = "SALES_CRM")
${crmVars}

### Accounting Document Variables (use when templateType = "ACCOUNTING_DOCUMENTS")
${docVars}

## Rules
- Use ONLY variable tokens from the selected category. Do NOT invent new variables.
- Variable tokens use the format {{variable.name}} — include the double curly braces.
- Keep the tone professional but friendly.
- If channel is EMAIL: body uses markdown. CRITICAL formatting rules: (1) Use \\n\\n (double newline) between paragraphs — single \\n collapses into one line. (2) For field details, use a bullet list with bold labels. Put a blank line before the first bullet. Example in JSON: "Here are the details:\\n\\n- **Invoice Number:** {{document.number}}\\n- **Invoice Date:** {{document.date}}\\n- **Due Date:** {{document.due_date}}\\n\\nNext paragraph here." — this renders as a proper bulleted list with bold labels.
- If channel is WHATSAPP: body must be plain text only (under 1024 chars), no markdown, no bold, no bullets.
- Template name should be short and descriptive (3-6 words).
- If channel is EMAIL: subject line should be concise and include relevant variables. If channel is WHATSAPP: set "subject" to empty string.
- Do NOT include a signature, sign-off, or closing (like "Best regards", "Thank you", sender name, phone, email) in the body. The app has a SEPARATE signature field that is automatically appended — anything you put in the body will be duplicated.
- End the body with the last meaningful content sentence. Do NOT end with a name, phone number, email, or "Regards".
- Only use variables that are contextually relevant to the template's purpose.

## Document Sharing Rules (for ACCOUNTING_DOCUMENTS only)
When generating templates for accounting documents (invoices, quotations, purchase orders, etc.):
- ALWAYS present document details as a bulleted list with bold labels. This applies to BOTH email and WhatsApp channels.
- For EMAIL, use markdown bullets: "\\n\\n- **Invoice Number:** {{document.number}}\\n- **Invoice Date:** {{document.date}}\\n- **Due Date:** {{document.due_date}}\\n- **Total Amount:** {{document.currency}} {{document.total}}\\n\\n"
- For WHATSAPP, use plain text bullets with emoji/dash: "\\n\\n- Invoice Number: {{document.number}}\\n- Invoice Date: {{document.date}}\\n- Due Date: {{document.due_date}}\\n- Total Amount: {{document.currency}} {{document.total}}\\n\\n"
- If amount due/paid tokens are available for the subtype, include them as additional bullet items.
- ALWAYS put currency BEFORE amount: {{document.currency}} {{document.total}}, {{document.currency}} {{document.amount_due}}, etc. Never the other way round.
- ALWAYS include a CTA button for the document share link. Do NOT use {{document.share_link}} as plain text. Use this exact CTA token format:
  {{cta label="View Invoice" url="{{document.share_link}}" bg="#7d42df" text="#ffffff"}}
  Adjust the label to match the document type (e.g. "View Quotation", "View Purchase Order", "View Credit Note").
  This CTA format works for BOTH email and WhatsApp channels.
- Address the customer by name using {{customer.name}}.
- Mention your business name using {{business.name}}.

## Output Format
Respond with ONLY a JSON object (no markdown fences, no explanation) in this exact shape:
{
  "channel": "EMAIL or WHATSAPP",
  "templateType": "SALES_CRM or ACCOUNTING_DOCUMENTS",
  "documentSubtype": "INVOICE, QUOTATION, etc. or null if SALES_CRM",
  "name": "Template Name Here",
  "subject": "Subject line here (empty string for WhatsApp)",
  "body": "Body content here",
  "signature": "Signature here (omit for WhatsApp)"
}

## Signature Rules (EMAIL only, omit signature field for WHATSAPP)
- The "signature" field is rendered in a SEPARATE block below the body — do NOT put any sign-off in the body.
- Use a short sign-off word (e.g. "Regards", "Best regards", "Thank you") on the first line, followed by relevant variable tokens on subsequent lines.
- Use newlines (\\n) to separate each line of the signature.
- For Sales CRM, use variables like {{my.name}}, {{my.business}}, {{my.phone}}.
- For Accounting Documents, use variables like {{business.name}}, {{business.email}}, {{business.phone}}.
- Keep it concise — 2 to 4 lines.
- Example: "Regards\\n{{my.name}}\\n{{my.business}}\\n{{my.phone}}"`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Generate a message template for the following use case:\n\n${input.description}`,
      },
    ],
    system: systemPrompt,
  });

  const textBlock = response.content.find((block) => block.type === 'text');

  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from AI model');
  }

  const rawText = textBlock.text.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  const parsed = JSON.parse(rawText) as GenerateTemplateResult & { documentSubtype?: string | null };

  if (!parsed.name || !parsed.body) {
    throw new Error('AI response missing required fields');
  }

  const templateType = ENABLED_EMAIL_TEMPLATE_TYPE_KEYS.includes(parsed.templateType)
    ? parsed.templateType
    : 'SALES_CRM';

  const documentSubtype =
    templateType === 'ACCOUNTING_DOCUMENTS' &&
    parsed.documentSubtype &&
    ACCOUNTING_DOCUMENT_SUBTYPE_KEYS.includes(parsed.documentSubtype as DocumentTemplateSubtypeKey)
      ? (parsed.documentSubtype as DocumentTemplateSubtypeKey)
      : undefined;

  const channel = parsed.channel === 'WHATSAPP' ? 'WHATSAPP' : 'EMAIL';

  return {
    name: parsed.name,
    subject: parsed.subject || '',
    body: parsed.body,
    signature: channel === 'EMAIL' ? (parsed.signature || undefined) : undefined,
    channel,
    templateType,
    documentSubtype,
  };
}
