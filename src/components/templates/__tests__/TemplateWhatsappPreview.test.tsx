import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TemplateWhatsappPreview from '../TemplateWhatsappPreview';

describe('TemplateWhatsappPreview', () => {
  const variableOptions = [
    {
      label: 'Contact Name',
      value: 'contact.name',
      group: 'CRM',
      scope: 'SALES_CRM' as const,
      sampleValue: 'Rahul Mehta',
    },
    {
      label: 'Document Sharelink',
      value: 'document.share_link',
      group: 'Document',
      scope: 'ACCOUNTING_DOCUMENTS' as const,
      sampleValue: 'https://share.refrens.local/invoices/INV-2026-001',
    },
  ];

  it('renders resolved variables inside a single template card within the figma-style whatsapp shell', () => {
    const { container } = render(
      <TemplateWhatsappPreview
        templateType='SALES_CRM'
        body={'Hello {{contact.name}}\n\nPlease review the updated details.'}
        variableOptions={variableOptions}
      />,
    );

    expect(screen.getByText(/whatsapp preview/i)).toBeInTheDocument();
    expect(screen.getByText('Martha Craig')).toBeInTheDocument();
    expect(screen.getByText(/tap here for contact info/i)).toBeInTheDocument();
    expect(screen.getByText(/fri, jul 26/i)).toBeInTheDocument();
    expect(screen.getByText(/message/i)).toBeInTheDocument();
    expect(screen.getByText('Hello Rahul Mehta')).toBeInTheDocument();
    expect(screen.getByText('Please review the updated details.')).toBeInTheDocument();

    const cards = container.querySelectorAll('.template-whatsapp-template-card');
    expect(cards).toHaveLength(1);
    expect(cards[0]?.querySelectorAll('.template-whatsapp-template-paragraph')).toHaveLength(2);
  });

  it('shows an empty state when no whatsapp message has been written yet', () => {
    render(
      <TemplateWhatsappPreview
        templateType='SALES_CRM'
        body=''
        variableOptions={variableOptions}
      />,
    );

    expect(screen.getByText(/start writing to preview this whatsapp message/i)).toBeInTheDocument();
  });

  it('renders plain share links as the footer action of the same template card', () => {
    const { container } = render(
      <TemplateWhatsappPreview
        templateType='ACCOUNTING_DOCUMENTS'
        body='Please review your invoice\n{{document.share_link}}'
        variableOptions={variableOptions}
      />,
    );

    expect(
      screen.getByRole('button', {
        name: /view invoice/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/5:25 pm/i)).toBeInTheDocument();
    expect(container.querySelectorAll('.template-whatsapp-template-card')).toHaveLength(1);
  });

  it('surfaces unsupported email CTA tokens with a whatsapp-specific hint', () => {
    render(
      <TemplateWhatsappPreview
        templateType='ACCOUNTING_DOCUMENTS'
        body={
          'Please review your invoice\n\n{{cta label="View Document" url="{{document.share_link}}" bg="#4f46e5" text="#ffffff"}}'
        }
        variableOptions={variableOptions}
      />,
    );

    expect(screen.getByRole('button', { name: /view document/i })).toBeInTheDocument();
    expect(screen.queryByText(/buttons aren't supported in whatsapp templates yet/i)).not.toBeInTheDocument();
  });
});
