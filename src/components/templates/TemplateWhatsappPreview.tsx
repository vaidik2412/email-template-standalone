'use client';

import React, { useMemo } from 'react';

import type { EmailTemplateTypeKey } from '@/data/email/templateTypes';
import type { TemplateVariableOption } from '@/types/templateVariable';
import { parseTemplateCtaSegments } from '@/utils/templateCtas';

import {
  buildTemplatePreviewValueMap,
  resolveTemplatePreviewText,
} from './templatePreviewUtils';

type TemplateWhatsappPreviewProps = {
  templateType: EmailTemplateTypeKey;
  body: string;
  variableOptions: TemplateVariableOption[];
  header?: string;
  footer?: string;
  buttonLabel?: string;
  buttonUrl?: string;
};

type WhatsappPreviewAction = {
  label: string;
  url?: string;
};

type WhatsappPreviewModel = {
  paragraphs: string[];
  action: WhatsappPreviewAction | null;
};

const URL_ONLY_PATTERN = /^https?:\/\/\S+$/;

const DOCUMENT_ACTION_LABELS: Record<string, string> = {
  invoices: 'Invoice',
  'proforma-invoices': 'Proforma Invoice',
  quotations: 'Quotation',
  'sales-orders': 'Sales Order',
  'purchase-orders': 'Purchase Order',
  'credit-notes': 'Credit Note',
  'debit-notes': 'Debit Note',
  'payment-receipts': 'Payment Receipt',
  'delivery-challans': 'Delivery Challan',
  expenditures: 'Expenditure',
  leads: 'Lead',
};

function formatPreviewLinkLabel(url: string) {
  return url.replace(/^https?:\/\//, '');
}

function deriveActionLabel(url: string, templateType: EmailTemplateTypeKey) {
  try {
    const parsedUrl = new URL(url);
    const firstPathSegment = parsedUrl.pathname.split('/').filter(Boolean)[0];

    if (firstPathSegment && DOCUMENT_ACTION_LABELS[firstPathSegment]) {
      return `View ${DOCUMENT_ACTION_LABELS[firstPathSegment]}`;
    }
  } catch {}

  return templateType === 'ACCOUNTING_DOCUMENTS' ? 'View Document' : 'View Details';
}

function renderParagraphWithInlineLinks(paragraph: string, keyPrefix: string) {
  const matches = paragraph.matchAll(/(https?:\/\/[^\s]+)/g);
  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  for (const match of matches) {
    const matchedUrl = match[0];
    const start = match.index ?? 0;

    if (start > cursor) {
      nodes.push(paragraph.slice(cursor, start));
    }

    nodes.push(
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

  if (cursor < paragraph.length) {
    nodes.push(paragraph.slice(cursor));
  }

  return nodes.length ? nodes : paragraph;
}

function buildWhatsappPreviewModel(
  body: string,
  previewVariableValues: Record<string, string>,
  templateType: EmailTemplateTypeKey,
): WhatsappPreviewModel {
  const bodyLines: string[] = [];
  let action: WhatsappPreviewAction | null = null;

  parseTemplateCtaSegments(body).forEach((segment) => {
    if (segment.type === 'markdown') {
      const resolvedValue = resolveTemplatePreviewText(segment.value, previewVariableValues);

      resolvedValue.split('\n').forEach((line) => {
        const trimmedLine = line.trim();

        if (!action && URL_ONLY_PATTERN.test(trimmedLine)) {
          action = {
            label: deriveActionLabel(trimmedLine, templateType),
            url: trimmedLine,
          };
          return;
        }

        bodyLines.push(line);
      });
      return;
    }

    if (segment.type === 'cta') {
      const resolvedUrl = resolveTemplatePreviewText(segment.url, previewVariableValues);

      if (!action) {
        action = {
          label:
            resolveTemplatePreviewText(segment.label, previewVariableValues).trim() ||
            deriveActionLabel(resolvedUrl, templateType),
          url: resolvedUrl,
        };
      }
    }
  });

  const paragraphs = bodyLines
    .join('\n')
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const documentShareLinkPreviewValue = previewVariableValues['document.share_link'];

  if (
    !action &&
    body.includes('{{document.share_link}}') &&
    typeof documentShareLinkPreviewValue === 'string' &&
    documentShareLinkPreviewValue
  ) {
    const normalizedParagraphs = paragraphs
      .map((paragraph) =>
        paragraph
          .split('\n')
          .filter((line) => line.trim() !== documentShareLinkPreviewValue)
          .join('\n')
          .trim(),
      )
      .filter(Boolean);

    return {
      paragraphs: normalizedParagraphs,
      action: {
        label: deriveActionLabel(documentShareLinkPreviewValue, templateType),
        url: documentShareLinkPreviewValue,
      },
    };
  }

  if (!action) {
    const normalizedParagraphs = paragraphs
      .map((paragraph) => {
        const remainingLines = paragraph
          .split('\n')
          .filter((line) => {
            const trimmedLine = line.trim();

            if (!action && URL_ONLY_PATTERN.test(trimmedLine)) {
              action = {
                label: deriveActionLabel(trimmedLine, templateType),
                url: trimmedLine,
              };
              return false;
            }

            return true;
          })
          .join('\n')
          .trim();

        return remainingLines;
      })
      .filter(Boolean);

    return {
      paragraphs: normalizedParagraphs,
      action,
    };
  }

  return {
    paragraphs,
    action,
  };
}

function BackIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden className='template-whatsapp-icon'>
      <path
        d='M14.5 4.5L7 12l7.5 7.5'
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2.4'
      />
    </svg>
  );
}

function VideoCallIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden className='template-whatsapp-icon'>
      <path
        d='M5 8.5A1.5 1.5 0 0 1 6.5 7h8A1.5 1.5 0 0 1 16 8.5v1.8l3-2v7.4l-3-2v1.8a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 5 15.5z'
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.8'
      />
    </svg>
  );
}

function CallIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden className='template-whatsapp-icon'>
      <path
        d='M8.1 6.2c.34-.34.88-.36 1.24-.04l1.72 1.55c.37.33.44.88.15 1.29l-1.06 1.54a12.2 12.2 0 0 0 3.3 3.3l1.54-1.06c.41-.29.96-.22 1.29.15l1.55 1.72c.32.36.3.9-.04 1.24l-.92.92c-.48.48-1.19.68-1.85.52-2.48-.61-4.9-2.25-6.79-4.14-1.89-1.89-3.53-4.31-4.14-6.79-.16-.66.04-1.37.52-1.85z'
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.8'
      />
    </svg>
  );
}

function ActionIcon() {
  return (
    <svg viewBox='0 0 20 20' aria-hidden className='template-whatsapp-action-icon'>
      <path
        d='M7 13l6-6M8 6h5v5M14 10.5V14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3.5'
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.8'
      />
    </svg>
  );
}

function ReadIcon() {
  return (
    <svg viewBox='0 0 16 10' aria-hidden className='template-whatsapp-read-icon'>
      <path
        d='M1.5 5.4l2.2 2.1L8 3.2'
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.7'
      />
      <path
        d='M6 5.4l2.2 2.1 4.3-4.3'
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.7'
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden className='template-whatsapp-icon'>
      <path
        d='M12 5.5v13M5.5 12h13'
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.8'
      />
    </svg>
  );
}

function StickerIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden className='template-whatsapp-icon'>
      <path
        d='M7 5.5h10A1.5 1.5 0 0 1 18.5 7v10a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 17V7A1.5 1.5 0 0 1 7 5.5Z'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
      />
      <path
        d='M14.5 18.5v-2.4a1.6 1.6 0 0 1 1.6-1.6h2.4'
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.8'
      />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden className='template-whatsapp-icon'>
      <path
        d='M6.5 8.5h2.1l1.2-1.7h4.4l1.2 1.7h2.1A1.5 1.5 0 0 1 19 10v6.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 16.5V10a1.5 1.5 0 0 1 1.5-1.5Z'
        fill='none'
        stroke='currentColor'
        strokeLinejoin='round'
        strokeWidth='1.8'
      />
      <circle cx='12' cy='13.2' r='2.7' fill='none' stroke='currentColor' strokeWidth='1.8' />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden className='template-whatsapp-icon'>
      <path
        d='M12 4.8a2.7 2.7 0 0 1 2.7 2.7v4.3a2.7 2.7 0 1 1-5.4 0V7.5A2.7 2.7 0 0 1 12 4.8Z'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
      />
      <path
        d='M7.6 11.5a4.4 4.4 0 1 0 8.8 0M12 15.9v3.3M9.3 19.2h5.4'
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.8'
      />
    </svg>
  );
}

export default function TemplateWhatsappPreview({
  templateType,
  body,
  variableOptions,
  header,
  footer,
  buttonLabel,
  buttonUrl,
}: TemplateWhatsappPreviewProps) {
  const previewValues = useMemo(
    () => buildTemplatePreviewValueMap(variableOptions),
    [variableOptions],
  );
  const previewModel = useMemo(
    () => buildWhatsappPreviewModel(body, previewValues, templateType),
    [body, previewValues, templateType],
  );

  const resolvedHeader = useMemo(
    () => (header ? resolveTemplatePreviewText(header, previewValues).trim() : ''),
    [header, previewValues],
  );

  const resolvedFooter = useMemo(
    () => (footer ? footer.trim() : ''),
    [footer],
  );

  const externalButton = useMemo(() => {
    if (!buttonLabel?.trim() || !buttonUrl?.trim()) {
      return null;
    }
    const resolvedUrl = resolveTemplatePreviewText(buttonUrl, previewValues).trim();
    return {
      label: resolveTemplatePreviewText(buttonLabel, previewValues).trim() || deriveActionLabel(resolvedUrl, templateType),
      url: resolvedUrl,
    };
  }, [buttonLabel, buttonUrl, previewValues, templateType]);

  const effectiveAction = externalButton || previewModel.action;
  const hasPreviewContent = previewModel.paragraphs.length > 0 || Boolean(resolvedHeader) || Boolean(effectiveAction);

  return (
    <div className='template-preview-stack'>
      <h2 className='template-preview-title'>WhatsApp preview</h2>
      <div className='template-whatsapp-preview'>
        <div className='template-whatsapp-screen'>
          <div className='template-whatsapp-status-bar'>
            <span className='template-whatsapp-status-time'>9:41</span>
            <div className='template-whatsapp-status-icons'>
              <span className='template-whatsapp-signal-bars' aria-hidden>
                <i />
                <i />
                <i />
                <i />
              </span>
              <span className='template-whatsapp-status-wifi' aria-hidden />
              <span className='template-whatsapp-status-battery' aria-hidden>
                <i />
              </span>
            </div>
          </div>

          <div className='template-whatsapp-header'>
            <button type='button' className='template-whatsapp-header-back' aria-label='Back'>
              <BackIcon />
            </button>

            <div className='template-whatsapp-contact-avatar'>M</div>
            <div className='template-whatsapp-contact-meta'>
              <strong className='template-whatsapp-contact-name'>Martha Craig</strong>
              <span className='template-whatsapp-contact-subtitle'>tap here for contact info</span>
            </div>

            <div className='template-whatsapp-header-actions'>
              <button
                type='button'
                className='template-whatsapp-header-action'
                aria-label='Start video call'
              >
                <VideoCallIcon />
              </button>
              <button
                type='button'
                className='template-whatsapp-header-action'
                aria-label='Start voice call'
              >
                <CallIcon />
              </button>
            </div>
          </div>

          <div className='template-whatsapp-chat-body'>
            <div className='template-whatsapp-chat-canvas'>
              {hasPreviewContent ? (
                <>
                  <div className='template-whatsapp-chat-date'>Fri, Jul 26</div>

                  <article className='template-whatsapp-template-card'>
                    {resolvedHeader ? (
                      <div className='template-whatsapp-template-header'>
                        {resolvedHeader}
                      </div>
                    ) : null}
                    <div className='template-whatsapp-template-card-body'>
                      {previewModel.paragraphs.map((paragraph, index) => (
                        <p
                          key={`${paragraph}-${index}`}
                          className={
                            index === 0 && !resolvedHeader
                              ? 'template-whatsapp-template-paragraph template-whatsapp-template-paragraph--lead'
                              : 'template-whatsapp-template-paragraph'
                          }
                        >
                          {renderParagraphWithInlineLinks(paragraph, `paragraph-${index}`)}
                        </p>
                      ))}
                    </div>

                    {resolvedFooter ? (
                      <div className='template-whatsapp-template-footer'>
                        {resolvedFooter}
                      </div>
                    ) : null}

                    <div className='template-whatsapp-template-meta'>
                      <span className='template-whatsapp-template-time'>5:25 PM</span>
                      <ReadIcon />
                    </div>

                    {effectiveAction ? (
                      <button type='button' className='template-whatsapp-template-action'>
                        <ActionIcon />
                        <span>{effectiveAction.label}</span>
                      </button>
                    ) : null}
                  </article>
                </>
              ) : (
                <p className='template-preview-empty template-preview-empty--chat'>
                  Start writing to preview this WhatsApp message.
                </p>
              )}
            </div>
          </div>

          <div className='template-whatsapp-compose-bar' aria-hidden>
            <button type='button' className='template-whatsapp-compose-icon-button'>
              <PlusIcon />
            </button>
            <div className='template-whatsapp-compose-input'>Message</div>
            <div className='template-whatsapp-compose-actions'>
              <button type='button' className='template-whatsapp-compose-icon-button'>
                <StickerIcon />
              </button>
              <button type='button' className='template-whatsapp-compose-icon-button'>
                <CameraIcon />
              </button>
              <button type='button' className='template-whatsapp-compose-icon-button'>
                <MicIcon />
              </button>
            </div>
          </div>

          <div className='template-whatsapp-home-indicator' aria-hidden>
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}
