import React from 'react';
import { render, screen } from '@testing-library/react';
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

    return <div data-testid='mock-toast-editor' />;
  });

  return {
    Editor: MockEditor,
  };
});

import ToastTemplateEditorClient from '../ToastTemplateEditorClient';

describe('ToastTemplateEditorClient', () => {
  it('uses prod-like editor config without an editor-specific add variable toolbar action', () => {
    render(<ToastTemplateEditorClient value='Hello' onChange={vi.fn()} />);

    expect(screen.getByTestId('mock-toast-editor')).toBeInTheDocument();
    expect(mockState.latestProps.previewStyle).toBe('tab');
    expect(mockState.latestProps.initialEditType).toBe('wysiwyg');
    expect(mockState.latestProps.hideModeSwitch).toBe(true);
    expect(mockState.latestProps.toolbarItems.flat()).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tooltip: 'Add variable',
        }),
      ]),
    );
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
        pendingVariableInsertion={{ id: 1, variableKey: 'contact.name' }}
      />,
    );

    expect(onActivate).toHaveBeenCalled();
    expect(mockState.focus).toHaveBeenCalled();
    expect(mockState.setSelection).toHaveBeenCalledWith(5, 5);
    expect(mockState.insertText).toHaveBeenCalledWith('{{contact.name}}');
  });
});
