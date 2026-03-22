'use client';

import React, { useEffect, useRef } from 'react';

import { insertTextAtSelection } from './templatePreviewUtils';
import type { TemplateVariableInsertionRequest } from './templateVariableInsertion';

type TemplatePlainTextEditorProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  maxLength?: number;
  onActivate?: () => void;
  pendingVariableInsertion?: TemplateVariableInsertionRequest | null;
};

export default function TemplatePlainTextEditor({
  id,
  label,
  value,
  onChange,
  error,
  helperText,
  maxLength,
  onActivate,
  pendingVariableInsertion = null,
}: TemplatePlainTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef<{ start: number | null; end: number | null }>({
    start: null,
    end: null,
  });
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const lastHandledInsertionRequestIdRef = useRef<number | null>(null);

  const applyTextInsertion = (text: string) => {
    const selectionStart = textareaRef.current?.selectionStart ?? selectionRef.current.start;
    const selectionEnd = textareaRef.current?.selectionEnd ?? selectionRef.current.end;
    const nextSelection = insertTextAtSelection(value, text, selectionStart, selectionEnd);

    pendingSelectionRef.current = {
      start: nextSelection.nextSelectionStart,
      end: nextSelection.nextSelectionEnd,
    };

    onChange(nextSelection.nextValue);
  };

  useEffect(() => {
    if (!pendingSelectionRef.current || !textareaRef.current) {
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
      !pendingVariableInsertion ||
      lastHandledInsertionRequestIdRef.current === pendingVariableInsertion.id
    ) {
      return;
    }

    lastHandledInsertionRequestIdRef.current = pendingVariableInsertion.id;
    applyTextInsertion(pendingVariableInsertion.text);
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
      <div className='field-heading-row'>
        <label className='field-label' htmlFor={id}>
          {label}
          <span>*</span>
        </label>
        {typeof maxLength === 'number' ? (
          <span className='template-character-counter'>
            {value.length} / {maxLength}
          </span>
        ) : null}
      </div>
      {helperText ? <p className='helper-text'>{helperText}</p> : null}
      <textarea
        id={id}
        ref={textareaRef}
        className='textarea-input template-plain-text-editor'
        rows={12}
        aria-label={label}
        value={value}
        maxLength={maxLength}
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
