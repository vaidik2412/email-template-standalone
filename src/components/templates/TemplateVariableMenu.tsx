'use client';

import React from 'react';

import { EMAIL_TEMPLATE_VARIABLE_OPTIONS } from '@/data/email/lmsVariables';

type TemplateVariableMenuProps = {
  onSelect: (variableKey: string) => void;
};

export default function TemplateVariableMenu({ onSelect }: TemplateVariableMenuProps) {
  return (
    <div className='template-variable-popup'>
      {EMAIL_TEMPLATE_VARIABLE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type='button'
          className='template-variable-popup-item'
          data-variable-key={option.value}
          onClick={() => {
            onSelect(option.value);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
