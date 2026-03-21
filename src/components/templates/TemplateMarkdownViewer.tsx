'use client';

import React from 'react';
import Markdown from 'markdown-to-jsx';

type TemplateMarkdownViewerProps = {
  value: string;
};

export default function TemplateMarkdownViewer({ value }: TemplateMarkdownViewerProps) {
  return (
    <div className='template-preview-fallback'>
      <Markdown
        options={{
          disableParsingRawHTML: true,
          forceBlock: true,
        }}
      >
        {value}
      </Markdown>
    </div>
  );
}
