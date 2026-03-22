import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  latestProps: null as any,
  insertText: vi.fn(),
  setMarkdown: vi.fn(),
  getSelection: vi.fn().mockReturnValue([5, 5]),
  setSelection: vi.fn(),
  focus: vi.fn(),
  moveCursorToEnd: vi.fn(),
}));

vi.mock('@toast-ui/react-editor', async () => {
  const ReactModule = await import('react');

  const MockEditor = ReactModule.forwardRef<any, any>((props, ref) => {
    mockState.latestProps = props;
    const toolbarRef = ReactModule.useRef<HTMLDivElement>(null);

    ReactModule.useEffect(() => {
      const toolbarElement = toolbarRef.current;

      if (!toolbarElement) {
        return;
      }

      toolbarElement.replaceChildren();

      props.toolbarItems
        .flat()
        .filter((item: any) => typeof item === 'object' && item?.el instanceof HTMLElement)
        .forEach((item: any) => {
          toolbarElement.appendChild(item.el);
        });
    }, [props.toolbarItems]);

    ReactModule.useImperativeHandle(ref, () => ({
      getInstance: () => ({
        getMarkdown: () => props.initialValue || '',
        insertText: mockState.insertText,
        setMarkdown: mockState.setMarkdown,
        getSelection: mockState.getSelection,
        setSelection: mockState.setSelection,
        focus: mockState.focus,
        moveCursorToEnd: mockState.moveCursorToEnd,
      }),
    }));

    return (
      <div data-testid='mock-toast-editor'>
        <div data-testid='mock-toast-toolbar' ref={toolbarRef} />
      </div>
    );
  });

  return {
    Editor: MockEditor,
  };
});

import ToastTemplateEditorClient from '../ToastTemplateEditorClient';

describe('ToastTemplateEditorClient', () => {
  it('uses prod-like editor config with a custom CTA toolbar action', async () => {
    render(<ToastTemplateEditorClient value='Hello' onChange={vi.fn()} />);

    expect(screen.getByTestId('mock-toast-editor')).toBeInTheDocument();
    expect(mockState.latestProps.previewStyle).toBe('tab');
    expect(mockState.latestProps.initialEditType).toBe('wysiwyg');
    expect(mockState.latestProps.hideModeSwitch).toBe(true);
    expect(mockState.latestProps.toolbarItems.flat()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tooltip: 'Insert button',
        }),
      ]),
    );
    expect(await screen.findByRole('button', { name: /insert button/i })).toBeInTheDocument();
  });

  it('applies an external variable insertion request at the remembered body selection', () => {
    const onActivate = vi.fn();
    const { rerender } = render(
      <ToastTemplateEditorClient
        value='Hello'
        onChange={vi.fn()}
        onActivate={onActivate}
        pendingVariableInsertion={null}
      />,
    );

    mockState.latestProps.onFocus?.('wysiwyg');

    rerender(
      <ToastTemplateEditorClient
        value='Hello'
        onChange={vi.fn()}
        onActivate={onActivate}
        pendingVariableInsertion={{ id: 1, text: '{{contact.name}}' }}
      />,
    );

    expect(onActivate).toHaveBeenCalled();
    expect(mockState.focus).toHaveBeenCalled();
    expect(mockState.setSelection).toHaveBeenCalledWith(5, 5);
    expect(mockState.insertText).toHaveBeenCalledWith('{{contact.name}}');
  });

  it('inserts a color-aware CTA token from the editor toolbar composer', async () => {
    render(<ToastTemplateEditorClient value='Hello' onChange={vi.fn()} />);

    await act(async () => {
      fireEvent.click(await screen.findByRole('button', { name: /insert button/i }));
    });

    fireEvent.change(screen.getByLabelText(/button label/i), {
      target: { value: 'Pay now' },
    });
    fireEvent.change(screen.getByLabelText(/button url/i), {
      target: { value: 'https://pay.test/{{document.number}}' },
    });
    fireEvent.change(screen.getByLabelText(/background color/i), {
      target: { value: '#0f766e' },
    });
    fireEvent.change(screen.getByLabelText(/text color/i), {
      target: { value: '#f8fafc' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^insert$/i }));
    });

    await waitFor(() => {
      expect(mockState.focus).toHaveBeenCalled();
      expect(mockState.moveCursorToEnd).toHaveBeenCalledWith(true);
      expect(mockState.insertText).toHaveBeenCalledWith(
        '{{cta label="Pay now" url="https://pay.test/{{document.number}}" bg="#0f766e" text="#f8fafc"}}',
      );
    });
  });
});
