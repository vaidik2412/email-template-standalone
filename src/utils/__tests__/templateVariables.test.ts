import { describe, expect, it } from 'vitest';

import { buildTemplateVariableCatalog } from '@/server/templateVariables/catalog';
import { findUnsupportedTemplateVariables } from '../templateVariables';

describe('findUnsupportedTemplateVariables', () => {
  it('flags invoice-only variables in quotation content', () => {
    const catalog = buildTemplateVariableCatalog({
      templateType: 'ACCOUNTING_DOCUMENTS',
      documentSubtype: 'QUOTATION',
    });

    expect(
      findUnsupportedTemplateVariables(
        'Hello {{customer.name}}. Paid {{document.amount_paid}}.',
        catalog.options.map((option) => option.value),
      ),
    ).toEqual(['document.amount_paid']);
  });

  it('accepts configured vendor fields for crm templates', () => {
    const catalog = buildTemplateVariableCatalog({
      templateType: 'SALES_CRM',
      indexedCustomFields: {
        LEADS: {
          lead_source: {
            name: 'lead_source',
            label: 'Lead Source',
            dataType: 'TEXT',
          },
        },
      },
    });

    expect(
      findUnsupportedTemplateVariables(
        'Hello {{contact.name}} from {{vendorFields.lead_source}}',
        catalog.options.map((option) => option.value),
      ),
    ).toEqual([]);
  });

  it('validates variables used inside CTA tokens without flagging the CTA wrapper', () => {
    const catalog = buildTemplateVariableCatalog({
      templateType: 'ACCOUNTING_DOCUMENTS',
      documentSubtype: 'INVOICE',
    });

    expect(
      findUnsupportedTemplateVariables(
        '{{cta label="Pay {{document.number}}" url="https://pay.test/{{document.amount_due}}"}}',
        catalog.options.map((option) => option.value),
      ),
    ).toEqual([]);
  });

  it('accepts document share links inside CTA shortcuts for accounting templates', () => {
    const catalog = buildTemplateVariableCatalog({
      templateType: 'ACCOUNTING_DOCUMENTS',
      documentSubtype: 'QUOTATION',
    });

    expect(
      findUnsupportedTemplateVariables(
        '{{cta label="View Quotation" url="{{document.share_link}}" bg="#4f46e5" text="#ffffff"}}',
        catalog.options.map((option) => option.value),
      ),
    ).toEqual([]);
  });
});
