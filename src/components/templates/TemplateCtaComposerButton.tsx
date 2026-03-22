'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { buildTemplateCtaToken } from '@/utils/templateCtas';
import {
  DEFAULT_TEMPLATE_CTA_BACKGROUND_COLOR,
  DEFAULT_TEMPLATE_CTA_TEXT_COLOR,
  readRecentTemplateCtaColors,
  saveRecentTemplateCtaColor,
} from '@/utils/templateCtaColors';

type TemplateCtaComposerButtonProps = {
  onInsert: (ctaToken: string) => void;
  onOpen?: () => void;
  buttonLabel?: string;
  buttonAriaLabel?: string;
  buttonClassName?: string;
};

export default function TemplateCtaComposerButton({
  onInsert,
  onOpen,
  buttonLabel = 'Insert button',
  buttonAriaLabel = 'Insert button',
  buttonClassName = 'template-variable-inline-button',
}: TemplateCtaComposerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_TEMPLATE_CTA_BACKGROUND_COLOR);
  const [textColor, setTextColor] = useState(DEFAULT_TEMPLATE_CTA_TEXT_COLOR);
  const [recentBackgroundColors, setRecentBackgroundColors] = useState<string[]>([]);
  const [recentTextColors, setRecentTextColors] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 16 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

  const syncPopoverPosition = () => {
    if (!buttonRef.current || typeof window === 'undefined') {
      return;
    }

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = 340;
    const horizontalPadding = 16;
    const maxLeft = Math.max(horizontalPadding, window.innerWidth - popoverWidth - horizontalPadding);

    setPopoverPosition({
      top: Math.max(12, buttonRect.bottom + 6),
      left: Math.min(Math.max(horizontalPadding, buttonRect.left), maxLeft),
    });
  };

  useEffect(() => {
    const handleWindowClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (containerRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }

      if (isOpen) {
        setIsOpen(false);
        setError(null);
      }
    };

    window.addEventListener('mousedown', handleWindowClick);

    return () => {
      window.removeEventListener('mousedown', handleWindowClick);
    };
  }, [isOpen]);

  useEffect(() => {
    const nextRecentBackgroundColors = readRecentTemplateCtaColors('background');
    const nextRecentTextColors = readRecentTemplateCtaColors('text');

    setRecentBackgroundColors(nextRecentBackgroundColors);
    setRecentTextColors(nextRecentTextColors);

    if (nextRecentBackgroundColors[0]) {
      setBackgroundColor(nextRecentBackgroundColors[0]);
    }

    if (nextRecentTextColors[0]) {
      setTextColor(nextRecentTextColors[0]);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    syncPopoverPosition();
    labelInputRef.current?.focus();

    window.addEventListener('resize', syncPopoverPosition);
    window.addEventListener('scroll', syncPopoverPosition, true);

    return () => {
      window.removeEventListener('resize', syncPopoverPosition);
      window.removeEventListener('scroll', syncPopoverPosition, true);
    };
  }, [isOpen]);

  const handleInsert = () => {
    const normalizedLabel = label.trim();
    const normalizedUrl = url.trim();

    if (!normalizedLabel || !normalizedUrl) {
      setError('Button label and URL are required.');
      return;
    }

    const nextRecentBackgroundColors = saveRecentTemplateCtaColor('background', backgroundColor);
    const nextRecentTextColors = saveRecentTemplateCtaColor('text', textColor);

    setRecentBackgroundColors(nextRecentBackgroundColors);
    setRecentTextColors(nextRecentTextColors);

    onInsert(
      buildTemplateCtaToken({
        label: normalizedLabel,
        url: normalizedUrl,
        backgroundColor,
        textColor,
      }),
    );
    setLabel('');
    setUrl('');
    setError(null);
    setIsOpen(false);
  };

  return (
    <div className='template-variable-menu-button-shell' ref={containerRef}>
      <button
        type='button'
        ref={buttonRef}
        className={buttonClassName}
        aria-label={buttonAriaLabel}
        aria-expanded={isOpen}
        onClick={() => {
          onOpen?.();
          setIsOpen((currentValue) => !currentValue);
          setError(null);
        }}
      >
        {buttonLabel}
      </button>

      {isOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={popoverRef}
              className='template-cta-inline-popover'
              style={{
                top: `${popoverPosition.top}px`,
                left: `${popoverPosition.left}px`,
              }}
            >
              <div className='template-cta-inline-form'>
                <label className='template-cta-inline-label' htmlFor='template-cta-label'>
                  Button label
                </label>
                <input
                  id='template-cta-label'
                  ref={labelInputRef}
                  type='text'
                  className='text-input'
                  aria-label='Button label'
                  value={label}
                  onChange={(event) => {
                    setLabel(event.target.value);
                  }}
                />

                <label className='template-cta-inline-label' htmlFor='template-cta-url'>
                  Button URL
                </label>
                <input
                  id='template-cta-url'
                  type='text'
                  className='text-input'
                  aria-label='Button URL'
                  value={url}
                  onChange={(event) => {
                    setUrl(event.target.value);
                  }}
                />
                <p className='template-cta-inline-helper'>
                  Supports plain URLs and template variables inside the link.
                </p>

                <div className='template-cta-color-grid'>
                  <div className='template-cta-color-field'>
                    <label
                      className='template-cta-inline-label'
                      htmlFor='template-cta-background-color'
                    >
                      Background color
                    </label>
                    <div className='template-cta-color-picker-row'>
                      <input
                        id='template-cta-background-color'
                        type='color'
                        aria-label='Background color'
                        className='template-cta-color-input'
                        value={backgroundColor}
                        onChange={(event) => {
                          setBackgroundColor(event.target.value);
                        }}
                      />
                      <span className='template-cta-color-value'>{backgroundColor}</span>
                    </div>
                    {recentBackgroundColors.length ? (
                      <div className='template-cta-recent-swatches'>
                        {recentBackgroundColors.map((color) => (
                          <button
                            key={color}
                            type='button'
                            className='template-cta-recent-swatch'
                            aria-label={`Use recent background color ${color}`}
                            title={color}
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              setBackgroundColor(color);
                            }}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className='template-cta-color-field'>
                    <label className='template-cta-inline-label' htmlFor='template-cta-text-color'>
                      Text color
                    </label>
                    <div className='template-cta-color-picker-row'>
                      <input
                        id='template-cta-text-color'
                        type='color'
                        aria-label='Text color'
                        className='template-cta-color-input'
                        value={textColor}
                        onChange={(event) => {
                          setTextColor(event.target.value);
                        }}
                      />
                      <span className='template-cta-color-value'>{textColor}</span>
                    </div>
                    {recentTextColors.length ? (
                      <div className='template-cta-recent-swatches'>
                        {recentTextColors.map((color) => (
                          <button
                            key={color}
                            type='button'
                            className='template-cta-recent-swatch'
                            aria-label={`Use recent text color ${color}`}
                            title={color}
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              setTextColor(color);
                            }}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className='template-cta-inline-preview'>
                  <span className='template-cta-inline-preview-label'>Preview</span>
                  <span
                    className='template-preview-cta-link template-preview-cta-link--inline'
                    style={{
                      backgroundColor,
                      color: textColor,
                    }}
                  >
                    {label.trim() || 'Preview button'}
                  </span>
                </div>

                {error ? <div className='field-error'>{error}</div> : null}

                <div className='template-cta-inline-actions'>
                  <button
                    type='button'
                    className='template-cta-inline-secondary'
                    onClick={() => {
                      setIsOpen(false);
                      setError(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type='button'
                    className='template-cta-inline-primary'
                    onClick={handleInsert}
                  >
                    Insert
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
