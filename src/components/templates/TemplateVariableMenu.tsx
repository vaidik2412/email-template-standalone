'use client';

import React from 'react';

import type { TemplateVariableOption } from '@/types/templateVariable';

type TemplateVariableMenuProps = {
  options: TemplateVariableOption[];
  onSelect: (option: TemplateVariableOption) => void;
};

export default function TemplateVariableMenu({ options, onSelect }: TemplateVariableMenuProps) {
  const groupedOptions = options.reduce<Record<string, TemplateVariableOption[]>>((acc, option) => {
    acc[option.group] = acc[option.group] || [];
    acc[option.group].push(option);
    return acc;
  }, {});

  return (
    <div className='template-variable-popup'>
      {Object.entries(groupedOptions).map(([groupLabel, groupOptions]) => (
        <div key={groupLabel} className='template-variable-popup-group'>
          {Object.keys(groupedOptions).length > 1 ? (
            <p className='template-variable-popup-group-label'>{groupLabel}</p>
          ) : null}
          {groupOptions.map((option) => (
            <button
              key={option.value}
              type='button'
              className='template-variable-popup-item'
              data-variable-key={option.value}
              onClick={() => {
                onSelect(option);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
