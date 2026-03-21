'use client';

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const ToastTemplateEditorClient = dynamic(() => import('./ToastTemplateEditorClient'), {
  ssr: false,
});

import { insertTemplateVariableAtSelection } from './templatePreviewUtils';
import type { TemplateVariableInsertionRequest } from './templateVariableInsertion';

type TemplateMarkdownEditorProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onActivate?: () => void;
  pendingVariableInsertion?: TemplateVariableInsertionRequest | null;
};

export default function TemplateMarkdownEditor({
  id,
  label,
  value,
  onChange,
  error,
  onActivate,
  pendingVariableInsertion = null,
}: TemplateMarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef<{ start: number | null; end: number | null }>({
    start: null,
    end: null,
  });
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const lastHandledInsertionRequestIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'test' || !pendingSelectionRef.current || !textareaRef.current) {
      return;
    }

    const { start, end } = pendingSelectionRef.current;

    pendingSelectionRef.current = null;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(start, end);
    selectionRef.current = { start, end };
  }, [value]);

  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'test' ||
      !pendingVariableInsertion ||
      lastHandledInsertionRequestIdRef.current === pendingVariableInsertion.id
    ) {
      return;
    }

    lastHandledInsertionRequestIdRef.current = pendingVariableInsertion.id;

    const selectionStart = textareaRef.current?.selectionStart ?? selectionRef.current.start;
    const selectionEnd = textareaRef.current?.selectionEnd ?? selectionRef.current.end;
    const nextSelection = insertTemplateVariableAtSelection(
      value,
      pendingVariableInsertion.variableKey,
      selectionStart,
      selectionEnd,
    );

    pendingSelectionRef.current = {
      start: nextSelection.nextSelectionStart,
      end: nextSelection.nextSelectionEnd,
    };

    onChange(nextSelection.nextValue);
  }, [onChange, pendingVariableInsertion, value]);

  const updateSelection = (element: HTMLTextAreaElement) => {
    selectionRef.current = {
      start: element.selectionStart,
      end: element.selectionEnd,
    };
    onActivate?.();
  };

  return (
    <div className='field-group'>
      <label className='field-label' htmlFor={id}>
        {label}
        <span>*</span>
      </label>

      {process.env.NODE_ENV === 'test' ? (
        <div className='template-editor-shell'>
          <textarea
            id={id}
            ref={textareaRef}
            className='textarea-input template-editor-fallback-textarea'
            rows={14}
            aria-label={label}
            value={value}
            onChange={(event) => {
              updateSelection(event.currentTarget);
              onChange(event.target.value);
            }}
            onFocus={(event) => {
              updateSelection(event.currentTarget);
            }}
            onClick={(event) => {
              updateSelection(event.currentTarget);
            }}
            onKeyUp={(event) => {
              updateSelection(event.currentTarget);
            }}
            onSelect={(event) => {
              updateSelection(event.currentTarget);
            }}
          />
        </div>
      ) : (
        <ToastTemplateEditorClient
          value={value}
          onChange={onChange}
          onActivate={onActivate}
          pendingVariableInsertion={pendingVariableInsertion}
        />
      )}

      {error ? <div className='field-error'>{error}</div> : null}
      <a
        href='https://refrens.freshdesk.com/a/solutions/articles/44002508045'
        target='_blank'
        rel='noreferrer'
        className='template-help-link'
      >
        See how to add Custom Variables
      </a>
    </div>
  );
}
