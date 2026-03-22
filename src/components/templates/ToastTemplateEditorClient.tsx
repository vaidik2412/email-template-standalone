'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@toast-ui/react-editor';
import type { EditorProps } from '@toast-ui/react-editor';
import type { SelectionPos } from '@toast-ui/editor';

import TemplateCtaComposerButton from './TemplateCtaComposerButton';
import type { TemplateVariableInsertionRequest } from './templateVariableInsertion';

type ToastTemplateEditorClientProps = {
  value: string;
  onChange: (value: string) => void;
  onActivate?: () => void;
  pendingVariableInsertion?: TemplateVariableInsertionRequest | null;
};

const VARIABLE_PATTERN = /\{\{[^}]+\.[^}]+\}\}/;

type WidgetRule = NonNullable<EditorProps['widgetRules']>[number];

export default function ToastTemplateEditorClient({
  value,
  onChange,
  onActivate,
  pendingVariableInsertion = null,
}: ToastTemplateEditorClientProps) {
  const editorRef = useRef<Editor>(null);
  const selectionRef = useRef<SelectionPos | null>(null);
  const lastHandledInsertionRequestIdRef = useRef<number | null>(null);
  const ctaToolbarMountElementRef = useRef<HTMLDivElement | null>(null);

  if (!ctaToolbarMountElementRef.current && typeof document !== 'undefined') {
    ctaToolbarMountElementRef.current = document.createElement('div');
    ctaToolbarMountElementRef.current.className = 'template-toolbar-cta-root';
  }

  useEffect(() => {
    const editor = editorRef.current?.getInstance();

    if (!editor) {
      return;
    }

    const markdown = editor.getMarkdown();

    if (markdown !== value) {
      editor.setMarkdown(value || '', false);
    }
  }, [value]);

  useEffect(() => {
    if (
      !pendingVariableInsertion ||
      lastHandledInsertionRequestIdRef.current === pendingVariableInsertion.id
    ) {
      return;
    }

    lastHandledInsertionRequestIdRef.current = pendingVariableInsertion.id;

    const editor = editorRef.current?.getInstance();

    if (!editor) {
      return;
    }

    editor.focus();

    if (selectionRef.current) {
      const [start, end] = selectionRef.current as [SelectionPos[0], SelectionPos[1]];

      editor.setSelection(start, end);
    } else {
      editor.moveCursorToEnd(true);
    }

    editor.insertText(pendingVariableInsertion.text);
    selectionRef.current = editor.getSelection();
  }, [pendingVariableInsertion]);

  const widgetRules = useMemo<WidgetRule[]>(
    () => [
      {
        rule: VARIABLE_PATTERN,
        toDOM(text: string) {
          const span = document.createElement('span');

          span.innerHTML = text;
          span.classList.add('highlighted-variable');

          return span;
        },
      },
    ],
    [],
  );

  const toolbarItems = useMemo(
    () => [
      ['heading', 'bold', 'italic', 'strike', 'link'],
      ['hr', 'quote'],
      ['ul', 'ol', 'task', 'indent', 'outdent'],
      ['code'],
      ctaToolbarMountElementRef.current
        ? [
            {
              name: 'ctaButton',
              tooltip: 'Insert button',
              el: ctaToolbarMountElementRef.current,
            },
          ]
        : [],
    ],
    [],
  );

  const syncSelection = () => {
    const editor = editorRef.current?.getInstance();

    if (!editor) {
      return;
    }

    selectionRef.current = editor.getSelection();
    onActivate?.();
  };

  return (
    <div className='template-editor-shell'>
      <Editor
        ref={editorRef}
        initialValue={value || ''}
        initialEditType='wysiwyg'
        previewStyle='tab'
        height='330px'
        minHeight='330px'
        placeholder='Write your email body'
        toolbarItems={toolbarItems}
        hideModeSwitch
        usageStatistics={false}
        autofocus={false}
        widgetRules={widgetRules}
        onFocus={() => {
          syncSelection();
        }}
        onBlur={() => {
          const editor = editorRef.current?.getInstance();

          if (!editor) {
            return;
          }

          selectionRef.current = editor.getSelection();
        }}
        onCaretChange={() => {
          syncSelection();
        }}
        onKeyup={() => {
          syncSelection();
        }}
        onChange={() => {
          onChange(editorRef.current?.getInstance().getMarkdown() || '');
        }}
      />
      {ctaToolbarMountElementRef.current
        ? createPortal(
            <TemplateCtaComposerButton
              buttonAriaLabel='Insert button'
              buttonClassName='template-toolbar-button template-toolbar-button--cta'
              buttonLabel='CTA'
              onOpen={() => {
                onActivate?.();
              }}
              onInsert={(ctaToken) => {
                const editor = editorRef.current?.getInstance();

                if (!editor) {
                  return;
                }

                onActivate?.();
                editor.focus();

                if (selectionRef.current) {
                  const [start, end] = selectionRef.current as [SelectionPos[0], SelectionPos[1]];

                  editor.setSelection(start, end);
                } else {
                  editor.moveCursorToEnd(true);
                }

                editor.insertText(ctaToken);
                selectionRef.current = editor.getSelection();
              }}
            />,
            ctaToolbarMountElementRef.current,
          )
        : null}
    </div>
  );
}
