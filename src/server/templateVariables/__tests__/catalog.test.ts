import { describe, expect, it } from 'vitest';

import { buildTemplateVariableCatalog } from '../catalog';

describe('buildTemplateVariableCatalog', () => {
  it('returns crm static variables plus leads vendor fields', () => {
    const catalog = buildTemplateVariableCatalog({
      templateType: 'SALES_CRM',
      indexedCustomFields: {
        LEADS: {
          lead_source: {
            name: 'lead_source',
            label: 'Lead Source',
            dataType: 'TEXT',
          },
          archived_field: {
            name: 'archived_field',
            label: 'Archived Field',
            dataType: 'TEXT',
            isArchived: true,
          },
        },
      },
    });

    expect(catalog.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: 'contact.name',
          group: 'CRM',
        }),
        expect.objectContaining({
          value: 'vendorFields.lead_source',
          label: 'Lead Source',
          group: 'Vendor Fields',
          sampleValue: 'Sample Lead Source',
        }),
      ]),
    );
    expect(catalog.options.find((option) => option.value === 'vendorFields.archived_field')).toBe(
      undefined,
    );
  });

  it('returns only quotation-safe variables for quotation templates', () => {
    const catalog = buildTemplateVariableCatalog({
      templateType: 'ACCOUNTING_DOCUMENTS',
      documentSubtype: 'QUOTATION',
      indexedCustomFields: {
        QUOTATION: {
          proposal_owner: {
            name: 'proposal_owner',
            label: 'Proposal Owner',
            dataType: 'TEXT',
          },
        },
        INVOICE: {
          invoice_batch: {
            name: 'invoice_batch',
            label: 'Invoice Batch',
            dataType: 'TEXT',
          },
        },
      },
    });

    expect(catalog.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: 'document.number',
          group: 'Document',
        }),
        expect.objectContaining({
          value: 'vendorFields.proposal_owner',
          label: 'Proposal Owner',
          group: 'Vendor Fields',
        }),
      ]),
    );
    expect(catalog.options.find((option) => option.value === 'document.amount_due')).toBeUndefined();
    expect(catalog.options.find((option) => option.value === 'document.amount_paid')).toBeUndefined();
    expect(catalog.options.find((option) => option.value === 'vendorFields.invoice_batch')).toBeUndefined();
  });

  it('includes payment status variables for invoice templates', () => {
    const catalog = buildTemplateVariableCatalog({
      templateType: 'ACCOUNTING_DOCUMENTS',
      documentSubtype: 'INVOICE',
      indexedCustomFields: {
        INVOICE: {
          invoice_owner: {
            name: 'invoice_owner',
            label: 'Invoice Owner',
            dataType: 'TEXT',
          },
        },
      },
    });

    expect(catalog.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: 'document.amount_paid',
          group: 'Document',
        }),
        expect.objectContaining({
          value: 'document.amount_due',
          group: 'Document',
        }),
        expect.objectContaining({
          value: 'vendorFields.invoice_owner',
          label: 'Invoice Owner',
        }),
        expect.objectContaining({
          value: 'document.share_link',
          label: 'Document Sharelink',
          bodyOnly: true,
          insertBehavior: 'documentShareLinkCta',
        }),
      ]),
    );
  });
});
