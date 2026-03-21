'use client';

import React, { useMemo } from 'react';

import TemplateMarkdownViewer from './TemplateMarkdownViewer';
import { EMAIL_TEMPLATE_PREVIEW_CONTEXT, resolveTemplatePreviewText } from './templatePreviewUtils';

type TemplateEmailPreviewProps = {
  subject: string;
  body: string;
  signature: string;
};

function formatPreviewPerson(name: string, email: string) {
  return `${name} <${email}>`;
}

export default function TemplateEmailPreview({
  subject,
  body,
  signature,
}: TemplateEmailPreviewProps) {
  const previewSubject = useMemo(() => resolveTemplatePreviewText(subject).trim(), [subject]);
  const previewBody = useMemo(() => resolveTemplatePreviewText(body).trim(), [body]);
  const previewSignatureLines = useMemo(
    () =>
      resolveTemplatePreviewText(signature)
        .trim()
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    [signature],
  );

  return (
    <div className='template-preview-card template-email-preview'>
      <div className='template-email-preview-meta'>
        <div className='template-email-preview-row'>
          <span className='template-email-preview-label'>From</span>
          <span className='template-email-preview-value'>
            {formatPreviewPerson(
              EMAIL_TEMPLATE_PREVIEW_CONTEXT.sender.name,
              EMAIL_TEMPLATE_PREVIEW_CONTEXT.sender.email,
            )}
          </span>
        </div>
        <div className='template-email-preview-row'>
          <span className='template-email-preview-label'>To</span>
          <span className='template-email-preview-value'>
            {formatPreviewPerson(
              EMAIL_TEMPLATE_PREVIEW_CONTEXT.recipient.name,
              EMAIL_TEMPLATE_PREVIEW_CONTEXT.recipient.email,
            )}
          </span>
        </div>
        <div className='template-email-preview-row template-email-preview-row--subject'>
          <span className='template-email-preview-label'>Subject</span>
          <span className='template-email-preview-value template-email-preview-value--subject'>
            {previewSubject || 'No subject yet'}
          </span>
        </div>
      </div>

      <div className='template-email-preview-body'>
        {previewBody ? (
          <TemplateMarkdownViewer value={previewBody} />
        ) : (
          <p className='template-preview-empty'>Start writing to preview this email.</p>
        )}

        {previewSignatureLines.length ? (
          <div className='template-preview-footer'>
            {previewSignatureLines.map((line, index) => (
              <p key={`${line}-${index}`}>{line}</p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
