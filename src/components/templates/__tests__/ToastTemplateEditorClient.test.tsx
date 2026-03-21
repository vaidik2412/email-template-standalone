import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  latestProps: null as any,
  insertText: vi.fn(),
  setMarkdown: vi.fn(),
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
  it('uses prod-like editor config without inline preview and with add variable toolbar action', () => {
    render(<ToastTemplateEditorClient value='Hello' onChange={vi.fn()} />);

    expect(screen.getByTestId('mock-toast-editor')).toBeInTheDocument();
    expect(mockState.latestProps.previewStyle).toBe('tab');
    expect(mockState.latestProps.initialEditType).toBe('wysiwyg');
    expect(mockState.latestProps.hideModeSwitch).toBe(true);

    const lastToolbarGroup =
      mockState.latestProps.toolbarItems[mockState.latestProps.toolbarItems.length - 1];
    const addVariableItem = lastToolbarGroup[0];

    expect(lastToolbarGroup).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tooltip: 'Add variable',
        }),
      ]),
    );
    expect(addVariableItem.name).toBe('Add variable');
    expect(addVariableItem.text).toBe('Add variable +');
    expect(addVariableItem.el.className).toContain('editor-toolbar-btn');
  });
});
