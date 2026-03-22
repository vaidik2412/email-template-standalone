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
  ];

  it('renders resolved variables inside the whatsapp message bubble', () => {
    render(
      <TemplateWhatsappPreview
        templateType='SALES_CRM'
        body='Hello {{contact.name}}'
        variableOptions={variableOptions}
      />,
    );

    expect(screen.getByText(/whatsapp preview/i)).toBeInTheDocument();
    expect(screen.getByText('Hello Rahul Mehta')).toBeInTheDocument();
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
});
