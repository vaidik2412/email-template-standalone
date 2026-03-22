'use client';

import React, { useMemo } from 'react';

import type { EmailTemplateTypeKey } from '@/data/email/templateTypes';
import type { TemplateVariableOption } from '@/types/templateVariable';

import {
  EMAIL_TEMPLATE_PREVIEW_CONTEXT,
  buildTemplatePreviewValueMap,
  resolveTemplatePreviewText,
} from './templatePreviewUtils';

type TemplateWhatsappPreviewProps = {
  templateType: EmailTemplateTypeKey;
  body: string;
  variableOptions: TemplateVariableOption[];
};

export default function TemplateWhatsappPreview({
  templateType,
  body,
  variableOptions,
}: TemplateWhatsappPreviewProps) {
  const previewValues = useMemo(
    () => buildTemplatePreviewValueMap(variableOptions),
    [variableOptions],
  );
  const previewBody = useMemo(
    () => resolveTemplatePreviewText(body, previewValues).trim(),
    [body, previewValues],
  );
  const recipientName =
    (templateType === 'ACCOUNTING_DOCUMENTS'
      ? previewValues['customer.name']
      : previewValues['contact.name']) || EMAIL_TEMPLATE_PREVIEW_CONTEXT.recipient.name;
  const recipientPhone =
    (templateType === 'ACCOUNTING_DOCUMENTS'
      ? previewValues['customer.phone']
      : previewValues['contact.phone']) || EMAIL_TEMPLATE_PREVIEW_CONTEXT.recipient.phone;

  return (
    <div className='template-preview-stack'>
      <h2 className='template-preview-title'>WhatsApp preview</h2>
      <div className='template-whatsapp-preview'>
        <div className='template-whatsapp-device'>
          <div className='template-whatsapp-status-bar'>
            <span>9:41</span>
            <span>Preview</span>
          </div>
          <div className='template-whatsapp-chat-header'>
            <div className='template-whatsapp-avatar'>{recipientName.slice(0, 1)}</div>
            <div className='template-whatsapp-chat-meta'>
              <strong>{recipientName}</strong>
              <span>{recipientPhone}</span>
            </div>
          </div>
          <div className='template-whatsapp-chat-body'>
            {previewBody ? (
              <div className='template-whatsapp-message-bubble'>
                <p className='template-whatsapp-message-text'>{previewBody}</p>
                <span className='template-whatsapp-message-time'>11:08</span>
              </div>
            ) : (
              <p className='template-preview-empty'>
                Start writing to preview this WhatsApp message.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
