'use client';

import React, { useState } from 'react';
import type { EmailTemplateTypeKey } from '@/data/email/templateTypes';
import type { DocumentTemplateSubtypeKey } from '@/data/email/documentSubtypes';

type AiGeneratedResult = {
  name: string;
  subject: string;
  body: string;
  signature?: string;
  channel: 'EMAIL' | 'WHATSAPP';
  templateType: EmailTemplateTypeKey;
  documentSubtype?: DocumentTemplateSubtypeKey;
};

type AiTemplatePromptProps = {
  onGenerated: (result: AiGeneratedResult) => void;
};

export default function AiTemplatePrompt({ onGenerated }: AiTemplatePromptProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    const trimmed = prompt.trim();

    if (!trimmed || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: trimmed }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to generate template');
      }

      const result = await response.json();
      onGenerated(result);
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate template');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleGenerate();
    }
  };

  return (
    <div className='ai-prompt-bar'>
      <div className='ai-prompt-bar-inner'>
        <span className='ai-prompt-bar-icon' aria-hidden='true'>
          &#9733;
        </span>
        <input
          type='text'
          className='ai-prompt-bar-input'
          placeholder='Describe the template you want to create...'
          value={prompt}
          onChange={(event) => {
            setPrompt(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
          aria-label='Describe the template you want AI to generate'
        />
        <button
          type='button'
          className='ai-prompt-bar-button'
          disabled={!prompt.trim() || isGenerating}
          onClick={() => void handleGenerate()}
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </div>
      {error ? <div className='ai-prompt-bar-error'>{error}</div> : null}
    </div>
  );
}
