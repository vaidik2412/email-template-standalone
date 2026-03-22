'use client';

import React, { useMemo } from 'react';
import Markdown from 'markdown-to-jsx';

import { parseTemplateCtaSegments } from '@/utils/templateCtas';
import {
  DEFAULT_TEMPLATE_CTA_BACKGROUND_COLOR,
  DEFAULT_TEMPLATE_CTA_TEXT_COLOR,
} from '@/utils/templateCtaColors';

import { resolveTemplatePreviewText } from './templatePreviewUtils';

type TemplateMarkdownViewerProps = {
  value: string;
  previewVariableValues?: Record<string, string>;
};

export default function TemplateMarkdownViewer({
  value,
  previewVariableValues,
}: TemplateMarkdownViewerProps) {
  const segments = useMemo(() => parseTemplateCtaSegments(value), [value]);

  return (
    <div className='template-preview-fallback'>
      {segments.map((segment, index) => {
        if (segment.type === 'cta') {
          const label = resolveTemplatePreviewText(segment.label, previewVariableValues).trim();
          const url = resolveTemplatePreviewText(segment.url, previewVariableValues).trim();

          return (
            <p key={`${segment.raw}-${index}`} className='template-preview-cta'>
              <a
                href={url || '#'}
                className='template-preview-cta-link'
                style={{
                  backgroundColor:
                    segment.backgroundColor || DEFAULT_TEMPLATE_CTA_BACKGROUND_COLOR,
                  color: segment.textColor || DEFAULT_TEMPLATE_CTA_TEXT_COLOR,
                }}
                onClick={(event) => {
                  event.preventDefault();
                }}
              >
                {label || 'Open link'}
              </a>
            </p>
          );
        }

        const markdownValue =
          segment.type === 'invalidCta'
            ? segment.raw
            : resolveTemplatePreviewText(segment.value, previewVariableValues);

        if (!markdownValue.trim()) {
          return null;
        }

        return (
          <Markdown
            key={`${segment.type}-${index}`}
            options={{
              disableParsingRawHTML: true,
              forceBlock: true,
            }}
          >
            {markdownValue}
          </Markdown>
        );
      })}
    </div>
  );
}
