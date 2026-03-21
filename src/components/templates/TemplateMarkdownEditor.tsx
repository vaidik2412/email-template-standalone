'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ToastTemplateEditorClient = dynamic(() => import('./ToastTemplateEditorClient'), {
  ssr: false,
});

type TemplateMarkdownEditorProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export default function TemplateMarkdownEditor({
  id,
  label,
  value,
  onChange,
  error,
}: TemplateMarkdownEditorProps) {
  return (
    <div className='field-group'>
      <label className='field-label' htmlFor={id}>
        {label}
        <span>*</span>
      </label>

      {process.env.NODE_ENV === 'test' ? (
        <div className='template-editor-shell'>
          <div className='template-editor-toolbar-fallback'>
            <button type='button' className='template-toolbar-button'>
              <span className='template-toolbar-button-plus'>+</span>
              Add variable
            </button>
          </div>
          <textarea
            id={id}
            className='textarea-input template-editor-fallback-textarea'
            rows={14}
            aria-label={label}
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
            }}
          />
        </div>
      ) : (
        <ToastTemplateEditorClient value={value} onChange={onChange} />
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
