'use client';

import React, { useMemo } from 'react';

import type { EmailTemplateTypeKey } from '@/data/email/templateTypes';
import type { TemplateVariableOption } from '@/types/templateVariable';

import TemplateMarkdownViewer from './TemplateMarkdownViewer';
import {
  EMAIL_TEMPLATE_PREVIEW_CONTEXT,
  buildTemplatePreviewValueMap,
  resolveTemplatePreviewText,
} from './templatePreviewUtils';

type TemplateEmailPreviewProps = {
  templateType: EmailTemplateTypeKey;
  subject: string;
  body: string;
  signature: string;
  variableOptions: TemplateVariableOption[];
};

function formatPreviewPerson(name: string, email: string) {
  return `${name} <${email}>`;
}

export default function TemplateEmailPreview({
  templateType,
  subject,
  body,
  signature,
  variableOptions,
}: TemplateEmailPreviewProps) {
  const previewValues = useMemo(
    () => buildTemplatePreviewValueMap(variableOptions),
    [variableOptions],
  );
  const previewSubject = useMemo(
    () => resolveTemplatePreviewText(subject, previewValues).trim(),
    [previewValues, subject],
  );
  const previewBody = useMemo(() => body.trim(), [body]);
  const previewSignatureLines = useMemo(
    () =>
      resolveTemplatePreviewText(signature, previewValues)
        .trim()
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    [previewValues, signature],
  );
  const previewRecipientName =
    (templateType === 'ACCOUNTING_DOCUMENTS'
      ? previewValues['customer.name']
      : previewValues['contact.name']) || EMAIL_TEMPLATE_PREVIEW_CONTEXT.recipient.name;
  const previewRecipientEmail =
    (templateType === 'ACCOUNTING_DOCUMENTS'
      ? previewValues['customer.email']
      : previewValues['contact.email']) || EMAIL_TEMPLATE_PREVIEW_CONTEXT.recipient.email;

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
            {formatPreviewPerson(previewRecipientName, previewRecipientEmail)}
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
          <TemplateMarkdownViewer value={previewBody} previewVariableValues={previewValues} />
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
