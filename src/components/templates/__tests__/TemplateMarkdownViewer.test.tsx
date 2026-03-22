import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TemplateMarkdownViewer from '../TemplateMarkdownViewer';

describe('TemplateMarkdownViewer', () => {
  it('renders CTA tokens as preview buttons while preserving surrounding markdown', () => {
    render(
      <TemplateMarkdownViewer
        value={
          'Hello {{customer.name}}\n\n{{cta label="Pay {{document.number}}" url="https://pay.test/{{document.number}}" bg="#0f766e" text="#f8fafc"}}\n\nThanks'
        }
        previewVariableValues={{
          'customer.name': 'Aarav Industries',
          'document.number': 'INV-2026-001',
        }}
      />,
    );

    expect(screen.getByText('Hello Aarav Industries')).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: 'Pay INV-2026-001',
      }),
    ).toHaveAttribute('href', 'https://pay.test/INV-2026-001');
    expect(
      screen.getByRole('link', {
        name: 'Pay INV-2026-001',
      }),
    ).toHaveStyle({
      backgroundColor: 'rgb(15, 118, 110)',
      color: 'rgb(248, 250, 252)',
    });
    expect(screen.getByText('Thanks')).toBeInTheDocument();
  });
});
