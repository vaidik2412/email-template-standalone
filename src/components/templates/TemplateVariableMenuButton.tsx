'use client';

import React, { useEffect, useRef, useState } from 'react';

import TemplateVariableMenu from './TemplateVariableMenu';

type TemplateVariableMenuButtonProps = {
  buttonLabel: string;
  buttonAriaLabel: string;
  onSelect: (variableKey: string) => void;
  disabled?: boolean;
};

export default function TemplateVariableMenuButton({
  buttonLabel,
  buttonAriaLabel,
  onSelect,
  disabled = false,
}: TemplateVariableMenuButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleWindowClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('mousedown', handleWindowClick);

    return () => {
      window.removeEventListener('mousedown', handleWindowClick);
    };
  }, []);

  return (
    <div className='template-variable-menu-button-shell' ref={containerRef}>
      <button
        type='button'
        className='template-variable-inline-button'
        aria-label={buttonAriaLabel}
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => {
          if (disabled) {
            return;
          }

          setIsOpen((currentValue) => !currentValue);
        }}
      >
        <span className='template-toolbar-button-plus'>+</span>
        {buttonLabel}
      </button>

      {isOpen ? (
        <div className='template-variable-inline-popover'>
          <TemplateVariableMenu
            onSelect={(variableKey) => {
              setIsOpen(false);
              onSelect(variableKey);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
