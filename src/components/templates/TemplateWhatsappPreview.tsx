'use client';

import React, { Fragment, useMemo } from 'react';

import type { EmailTemplateTypeKey } from '@/data/email/templateTypes';
import type { TemplateVariableOption } from '@/types/templateVariable';
import { parseTemplateCtaSegments } from '@/utils/templateCtas';

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

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

function formatPreviewLinkLabel(url: string) {
  return url.replace(/^https?:\/\//, '');
}

function renderInlineTextWithLinks(text: string, keyPrefix: string) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const matchedUrl = match[0];
    const start = match.index ?? 0;

    if (start > cursor) {
      parts.push(text.slice(cursor, start));
    }

    parts.push(
      <a
        key={`${keyPrefix}-${start}`}
        href={matchedUrl}
        className='template-whatsapp-inline-link'
        target='_blank'
        rel='noreferrer'
      >
        {formatPreviewLinkLabel(matchedUrl)}
      </a>,
    );

    cursor = start + matchedUrl.length;
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts.length ? parts : text;
}

function renderResolvedTextBlocks(text: string, keyPrefix: string) {
  return text.split('\n').map((line, index) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      return (
        <div
          key={`${keyPrefix}-spacer-${index}`}
          className='template-whatsapp-message-spacer'
          aria-hidden
        />
      );
    }

    if (/^https?:\/\/\S+$/.test(trimmedLine)) {
      return (
        <a
          key={`${keyPrefix}-link-${index}`}
          href={trimmedLine}
          className='template-whatsapp-link-card'
          target='_blank'
          rel='noreferrer'
        >
          <span className='template-whatsapp-link-card-label'>Shared document</span>
          <span className='template-whatsapp-link-card-url'>{formatPreviewLinkLabel(trimmedLine)}</span>
        </a>
      );
    }

    return (
      <p key={`${keyPrefix}-line-${index}`} className='template-whatsapp-message-line'>
        {renderInlineTextWithLinks(line, `${keyPrefix}-line-${index}`)}
      </p>
    );
  });
}

export default function TemplateWhatsappPreview({
  templateType,
  body,
  variableOptions,
}: TemplateWhatsappPreviewProps) {
  const previewValues = useMemo(
    () => buildTemplatePreviewValueMap(variableOptions),
    [variableOptions],
  );
  const previewSegments = useMemo(
    () =>
      parseTemplateCtaSegments(body).map((segment) => {
        if (segment.type === 'markdown') {
          return {
            type: 'markdown' as const,
            value: resolveTemplatePreviewText(segment.value, previewValues),
          };
        }

        if (segment.type === 'cta') {
          return {
            type: 'cta' as const,
            label: resolveTemplatePreviewText(segment.label, previewValues),
            url: resolveTemplatePreviewText(segment.url, previewValues),
          };
        }

        return {
          type: 'invalidCta' as const,
          raw: segment.raw,
        };
      }),
    [body, previewValues],
  );
  const hasPreviewContent = useMemo(
    () =>
      previewSegments.some((segment) => {
        if (segment.type === 'markdown') {
          return segment.value.trim().length > 0;
        }

        return true;
      }),
    [previewSegments],
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
            <span className='template-whatsapp-status-icons'>
              <span aria-hidden>◔</span>
              <span aria-hidden>◔</span>
              <span aria-hidden>▮</span>
            </span>
          </div>
          <div className='template-whatsapp-chat-header'>
            <div className='template-whatsapp-avatar'>{recipientName.slice(0, 1)}</div>
            <div className='template-whatsapp-chat-meta'>
              <strong>{recipientName}</strong>
              <span>online now · {recipientPhone}</span>
            </div>
          </div>
          <div className='template-whatsapp-chat-body'>
            <div className='template-whatsapp-day-pill'>Today</div>
            {hasPreviewContent ? (
              <div className='template-whatsapp-message-bubble'>
                <div className='template-whatsapp-message-content'>
                  {previewSegments.map((segment, index) => {
                    if (segment.type === 'markdown') {
                      return (
                        <Fragment key={`segment-${index}`}>
                          {renderResolvedTextBlocks(segment.value, `segment-${index}`)}
                        </Fragment>
                      );
                    }

                    if (segment.type === 'cta') {
                      return (
                        <div key={`segment-${index}`} className='template-whatsapp-cta-warning'>
                          <p className='template-whatsapp-cta-warning-title'>
                            Buttons aren&apos;t supported in WhatsApp templates yet.
                          </p>
                          <p className='template-whatsapp-cta-warning-copy'>
                            Replace this with {'{{document.share_link}}'} or a plain URL line.
                          </p>
                          <a
                            href={segment.url}
                            className='template-whatsapp-link-card'
                            target='_blank'
                            rel='noreferrer'
                          >
                            <span className='template-whatsapp-link-card-label'>{segment.label}</span>
                            <span className='template-whatsapp-link-card-url'>
                              {formatPreviewLinkLabel(segment.url)}
                            </span>
                          </a>
                        </div>
                      );
                    }

                    return (
                      <div key={`segment-${index}`} className='template-whatsapp-cta-warning'>
                        <p className='template-whatsapp-cta-warning-title'>
                          This CTA token can&apos;t be used in a WhatsApp body.
                        </p>
                        <p className='template-whatsapp-cta-warning-copy'>
                          Replace this with {'{{document.share_link}}'} or plain text before
                          publishing.
                        </p>
                      </div>
                    );
                  })}
                </div>
                <span className='template-whatsapp-message-time'>
                  11:08 <span aria-hidden>✓✓</span>
                </span>
              </div>
            ) : (
              <p className='template-preview-empty'>
                Start writing to preview this WhatsApp message.
              </p>
            )}
          </div>
          <div className='template-whatsapp-compose-bar' aria-hidden>
            <span className='template-whatsapp-compose-icon'>⌄</span>
            <div className='template-whatsapp-compose-input'>Message</div>
            <span className='template-whatsapp-compose-icon'>⌂</span>
          </div>
        </div>
      </div>
    </div>
  );
}
