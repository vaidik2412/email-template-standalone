import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/dynamic', () => ({
  default: () =>
    function MockToastTemplateViewerClient(props: { value: string }) {
      return <div data-testid='toast-template-viewer-client'>{props.value}</div>;
    },
}));

import TemplateMarkdownViewer from '../TemplateMarkdownViewer';

describe('TemplateMarkdownViewer', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('uses the safe fallback renderer for template preview markdown in development', () => {
    process.env.NODE_ENV = 'development';

    render(<TemplateMarkdownViewer value='Hello {{contact.name}}' />);

    expect(screen.queryByTestId('toast-template-viewer-client')).not.toBeInTheDocument();
    expect(screen.getByText('Hello {{contact.name}}')).toBeInTheDocument();
  });
});
