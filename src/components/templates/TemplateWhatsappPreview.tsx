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

function VerifiedBadge() {
  return (
    <svg viewBox='0 0 16 16' aria-hidden className='template-whatsapp-verified-badge'>
      <circle cx='8' cy='8' r='8' fill='#1d9bf0' />
      <path
        d='M4.7 8.2l1.8 1.8 4.7-4.8'
        fill='none'
        stroke='#fff'
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

export default function TemplateWhatsappPreview({
  templateType,
  body,
  variableOptions,
}: TemplateWhatsappPreviewProps) {
  const previewValues = useMemo(
    () => buildTemplatePreviewValueMap(variableOptions),
    [variableOptions],
  );
  const previewModel = useMemo(
    () => buildWhatsappPreviewModel(body, previewValues, templateType),
    [body, previewValues, templateType],
  );
  const hasPreviewContent = previewModel.paragraphs.length > 0 || Boolean(previewModel.action);

  return (
    <div className='template-preview-stack'>
      <h2 className='template-preview-title'>WhatsApp preview</h2>
      <div className='template-whatsapp-preview'>
        <div className='template-whatsapp-screen'>
          <div className='template-whatsapp-status-bar'>
            <span className='template-whatsapp-status-time'>11:59</span>
            <div className='template-whatsapp-status-icons'>
              <span className='template-whatsapp-signal-bars' aria-hidden>
                <i />
                <i />
                <i />
                <i />
              </span>
              <span className='template-whatsapp-status-wifi' aria-hidden />
              <span className='template-whatsapp-status-battery' aria-hidden>
                <b>22</b>
              </span>
            </div>
          </div>

          <div className='template-whatsapp-header'>
            <button type='button' className='template-whatsapp-header-back' aria-label='Back'>
              <BackIcon />
            </button>
            <span className='template-whatsapp-header-code'>802</span>
            <div className='template-whatsapp-brand-avatar'>R</div>
            <div className='template-whatsapp-brand-meta'>
              <div className='template-whatsapp-brand-name-row'>
                <strong>Refrens</strong>
                <VerifiedBadge />
              </div>
              <span>tap here to add to contacts</span>
            </div>
          </div>

          <div className='template-whatsapp-chat-body'>
            {hasPreviewContent ? (
              <article className='template-whatsapp-template-card'>
                <div className='template-whatsapp-template-card-body'>
                  {previewModel.paragraphs.map((paragraph, index) => (
                    <p
                      key={`${paragraph}-${index}`}
                      className={
                        index === 0
                          ? 'template-whatsapp-template-paragraph template-whatsapp-template-paragraph--lead'
                          : 'template-whatsapp-template-paragraph'
                      }
                    >
                      {renderParagraphWithInlineLinks(paragraph, `paragraph-${index}`)}
                    </p>
                  ))}
                </div>

                <div className='template-whatsapp-template-meta'>
                  <span className='template-whatsapp-template-time'>5:25 PM</span>
                </div>

                {previewModel.action ? (
                  <button type='button' className='template-whatsapp-template-action'>
                    <ActionIcon />
                    <span>{previewModel.action.label}</span>
                  </button>
                ) : null}
              </article>
            ) : (
              <p className='template-preview-empty'>
                Start writing to preview this WhatsApp message.
              </p>
            )}
          </div>

          <div className='template-whatsapp-compose-bar' aria-hidden>
            <span className='template-whatsapp-compose-plus'>+</span>
            <div className='template-whatsapp-compose-input'>Message</div>
            <div className='template-whatsapp-compose-actions'>
              <span className='template-whatsapp-compose-camera' />
              <span className='template-whatsapp-compose-mic' />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
