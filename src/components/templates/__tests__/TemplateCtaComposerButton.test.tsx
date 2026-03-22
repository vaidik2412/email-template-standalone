import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  TEMPLATE_CTA_RECENT_BACKGROUND_COLORS_STORAGE_KEY,
  TEMPLATE_CTA_RECENT_TEXT_COLORS_STORAGE_KEY,
} from '@/utils/templateCtaColors';
import TemplateCtaComposerButton from '../TemplateCtaComposerButton';

describe('TemplateCtaComposerButton', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
      },
    });

    window.localStorage.removeItem(TEMPLATE_CTA_RECENT_BACKGROUND_COLORS_STORAGE_KEY);
    window.localStorage.removeItem(TEMPLATE_CTA_RECENT_TEXT_COLORS_STORAGE_KEY);
  });

  it('persists the most recently used colors and restores them on remount', async () => {
    const onInsert = vi.fn();
    const { unmount } = render(<TemplateCtaComposerButton onInsert={onInsert} />);

    fireEvent.click(screen.getByRole('button', { name: /insert button/i }));
    fireEvent.change(screen.getByLabelText(/button label/i), {
      target: { value: 'Pay invoice' },
    });
    fireEvent.change(screen.getByLabelText(/button url/i), {
      target: { value: 'https://pay.test' },
    });
    fireEvent.change(screen.getByLabelText(/^background color$/i), {
      target: { value: '#0f766e' },
    });
    fireEvent.change(screen.getByLabelText(/^text color$/i), {
      target: { value: '#f8fafc' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^insert$/i }));

    await waitFor(() => {
      expect(onInsert).toHaveBeenCalledWith(
        '{{cta label="Pay invoice" url="https://pay.test" bg="#0f766e" text="#f8fafc"}}',
      );
    });

    unmount();

    render(<TemplateCtaComposerButton onInsert={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /insert button/i }));

    expect(screen.getByLabelText(/^background color$/i)).toHaveValue('#0f766e');
    expect(screen.getByLabelText(/^text color$/i)).toHaveValue('#f8fafc');
    expect(screen.getByRole('button', { name: /use recent background color #0f766e/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /use recent text color #f8fafc/i })).toBeInTheDocument();
  });

  it('renders the CTA styling panel outside the clipped editor container', () => {
    const { container } = render(
      <div data-testid='clipped-shell'>
        <TemplateCtaComposerButton onInsert={vi.fn()} />
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: /insert button/i }));

    expect(document.body.querySelector('.template-cta-inline-popover')).toBeInTheDocument();
    expect(container.querySelector('.template-cta-inline-popover')).not.toBeInTheDocument();
  });
});
