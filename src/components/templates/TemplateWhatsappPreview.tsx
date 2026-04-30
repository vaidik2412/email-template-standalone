'use client';

import React, { useMemo } from 'react';

import type { EmailTemplateTypeKey } from '@/data/email/templateTypes';
import type { TemplateVariableOption } from '@/types/templateVariable';
import { parseTemplateCtaSegments } from '@/utils/templateCtas';

import {
  EMAIL_TEMPLATE_PREVIEW_CONTEXT,
  buildTemplatePreviewValueMap,
  resolveTemplatePreviewText,
} from './templatePreviewUtils';

type WhatsappCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';

type TemplateWhatsappPreviewProps = {
  templateType: EmailTemplateTypeKey;
  body: string;
  variableOptions: TemplateVariableOption[];
  header?: string;
  footer?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  category?: WhatsappCategory;
};

type PreviewButton = {
  type: 'URL' | 'QUICK_REPLY' | 'COPY_CODE' | 'PHONE';
  label: string;
  url?: string;
};

type PreviewModel = {
  paragraphs: string[];
  buttons: PreviewButton[];
};

const URL_ONLY_PATTERN = /^https?:\/\/\S+$/;

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", Roboto, "Noto Sans", "Noto Sans Devanagari", sans-serif';

const WA_WALLPAPER_URL =
  'https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png';

const CATEGORY_STYLE: Record<WhatsappCategory, { bg: string; color: string }> = {
  MARKETING: { bg: '#FDF0F7', color: '#E6007B' },
  UTILITY: { bg: '#F0F7FF', color: '#017AFE' },
  AUTHENTICATION: { bg: '#EEFEF4', color: '#0F9A4B' },
};

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

/* ----------------------------- WhatsApp markdown ----------------------------- */
/* Mirrors design: *bold*, _italic_, ~~strikethrough~~, `code` */
function parseWAText(text: string): React.ReactNode {
  if (!text) return null;
  const lines = text.split('\n');
  let key = 0;
  return lines.map((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    const re = /\*([^*\n]+)\*|_([^_\n]+)_|~~([^~\n]+)~~|`([^`\n]+)`/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) {
        parts.push(<span key={key++}>{line.slice(last, m.index)}</span>);
      }
      if (m[1]) {
        parts.push(
          <strong key={key++} style={{ fontWeight: 600 }}>
            {m[1]}
          </strong>,
        );
      } else if (m[2]) {
        parts.push(
          <em key={key++} style={{ fontStyle: 'italic' }}>
            {m[2]}
          </em>,
        );
      } else if (m[3]) {
        parts.push(
          <span key={key++} style={{ textDecoration: 'line-through', opacity: 0.65 }}>
            {m[3]}
          </span>,
        );
      } else if (m[4]) {
        parts.push(
          <code
            key={key++}
            style={{
              background: 'rgba(0,0,0,.07)',
              borderRadius: 3,
              padding: '1px 4px',
              fontSize: '0.88em',
              fontFamily: 'monospace',
            }}
          >
            {m[4]}
          </code>,
        );
      }
      last = m.index + m[0].length;
    }
    if (last < line.length) {
      parts.push(<span key={key++}>{line.slice(last)}</span>);
    }
    return (
      <React.Fragment key={lineIdx}>
        {parts}
        {lineIdx < lines.length - 1 ? <br /> : null}
      </React.Fragment>
    );
  });
}

/* --------------- Build the preview model from body + variable values --------------- */
function buildWhatsappPreviewModel(
  body: string,
  previewVariableValues: Record<string, string>,
  templateType: EmailTemplateTypeKey,
): PreviewModel {
  const bodyLines: string[] = [];
  const buttons: PreviewButton[] = [];

  parseTemplateCtaSegments(body).forEach((segment) => {
    if (segment.type === 'markdown') {
      const resolved = resolveTemplatePreviewText(segment.value, previewVariableValues);
      resolved.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (!buttons.length && URL_ONLY_PATTERN.test(trimmed)) {
          buttons.push({
            type: 'URL',
            label: deriveActionLabel(trimmed, templateType),
            url: trimmed,
          });
          return;
        }
        bodyLines.push(line);
      });
      return;
    }

    if (segment.type === 'cta') {
      const resolvedUrl = resolveTemplatePreviewText(segment.url, previewVariableValues);
      const resolvedLabel = resolveTemplatePreviewText(
        segment.label,
        previewVariableValues,
      ).trim();
      if (!buttons.length) {
        buttons.push({
          type: 'URL',
          label: resolvedLabel || deriveActionLabel(resolvedUrl, templateType),
          url: resolvedUrl,
        });
      }
    }
  });

  const paragraphs = bodyLines
    .join('\n')
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);

  // Fallback: if a {{document.share_link}} variable existed and wasn't pulled out as a URL line,
  // promote it to the action button.
  const documentShareLink = previewVariableValues['document.share_link'];
  if (
    !buttons.length &&
    body.includes('{{document.share_link}}') &&
    typeof documentShareLink === 'string' &&
    documentShareLink
  ) {
    const cleaned = paragraphs
      .map((p) =>
        p
          .split('\n')
          .filter((line) => line.trim() !== documentShareLink)
          .join('\n')
          .trim(),
      )
      .filter(Boolean);
    return {
      paragraphs: cleaned,
      buttons: [
        {
          type: 'URL',
          label: deriveActionLabel(documentShareLink, templateType),
          url: documentShareLink,
        },
      ],
    };
  }

  return { paragraphs, buttons };
}

/* ----------------------------------- Icons ----------------------------------- */

const Ic = {
  Back: () => (
    <svg width='11' height='18' viewBox='0 0 11 18' fill='none' aria-hidden>
      <path
        d='M10 1L2 9L10 17'
        stroke='#007AFF'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  ),
  Video: () => (
    <svg
      width='26'
      height='26'
      viewBox='0 0 24 24'
      fill='none'
      stroke='#0B141B'
      strokeWidth='1.6'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
    >
      <polygon points='23 7 16 12 23 17 23 7' />
      <rect x='1' y='5' width='15' height='14' rx='2' />
    </svg>
  ),
  Phone: () => (
    <svg width='26' height='26' viewBox='0 0 24 24' fill='#0B141B' aria-hidden>
      <path d='M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z' />
    </svg>
  ),
  Link: () => (
    <svg
      width='15'
      height='15'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
    >
      <path d='M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6' />
      <polyline points='15 3 21 3 21 9' />
      <line x1='10' y1='14' x2='21' y2='3' />
    </svg>
  ),
  PhoneBtn: () => (
    <svg
      width='15'
      height='15'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
    >
      <path d='M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.88 19.79 19.79 0 01.08 1.28 2 2 0 012.06 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z' />
    </svg>
  ),
  Copy: () => (
    <svg
      width='15'
      height='15'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
    >
      <rect x='9' y='9' width='13' height='13' rx='2' />
      <path d='M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1' />
    </svg>
  ),
  Tick2: () => (
    <svg width='18' height='10' viewBox='0 0 18 11' fill='none' aria-hidden>
      <path
        d='M1 5.5L5 9.5L13 1.5'
        stroke='#53BDEB'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M7 5.5L11 9.5L17 1.5'
        stroke='#53BDEB'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  ),
  Camera: () => (
    <svg
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      stroke='#0B141B'
      strokeWidth='1.6'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
    >
      <path d='M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z' />
      <circle cx='12' cy='13' r='4' />
    </svg>
  ),
  Mic: () => (
    <svg
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      stroke='#0B141B'
      strokeWidth='1.6'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
    >
      <path d='M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z' />
      <path d='M19 10v2a7 7 0 01-14 0v-2' />
      <line x1='12' y1='19' x2='12' y2='23' />
      <line x1='8' y1='23' x2='16' y2='23' />
    </svg>
  ),
  Plus: () => (
    <svg
      width='26'
      height='26'
      viewBox='0 0 24 24'
      fill='none'
      stroke='#0B141B'
      strokeWidth='1.6'
      strokeLinecap='round'
      aria-hidden
    >
      <line x1='12' y1='5' x2='12' y2='19' />
      <line x1='5' y1='12' x2='19' y2='12' />
    </svg>
  ),
  Rupee: () => (
    <svg
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      stroke='#0B141B'
      strokeWidth='1.6'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
    >
      <circle cx='12' cy='12' r='10' />
      <path d='M8.5 7.5h7M8.5 11h7M9.5 7.5c2 0 3.5 1 3.5 3s-1.5 3.5-3.5 3.5h-1l5.5 5' />
    </svg>
  ),
  Sticker: () => (
    <svg
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      stroke='#8696A0'
      strokeWidth='1.6'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
    >
      <path d='M14 3H6a3 3 0 00-3 3v12a3 3 0 003 3h9l6-6V6a3 3 0 00-3-3z' />
      <path d='M14 21v-3a3 3 0 013-3h3' />
    </svg>
  ),
  WhatsAppGlyph: () => (
    <svg width='20' height='20' viewBox='0 0 90 90' fill='none' aria-hidden>
      <path
        fill='#25D366'
        d='M90 43.84C90 68.05 70.04 87.68 45.43 87.68a45 45 0 01-21.7-5.55L0 90l7.99-23.54a43.27 43.27 0 01-6.07-22.62C1.92 19.63 21.88 0 46.49 0 71.1 0 90 19.63 90 43.84z'
      />
      <path
        fill='#fff'
        d='M22.07 64.22l4.84-17.6a33.86 33.86 0 01-4.55-17.04C22.36 13.42 35.52.84 51.7.84c7.85 0 15.22 3 20.77 8.45a28.05 28.05 0 018.6 20.3c-.01 15.94-13.16 28.96-29.36 28.96h-.02a30 30 0 01-14.16-3.55l-15.46 4.04zm17.92-10.85l.93.53a25.04 25.04 0 0012.94 3.5h.01c13.45 0 24.4-10.83 24.4-24.13 0-6.45-2.55-12.5-7.16-17.06a24.4 24.4 0 00-17.23-7.07c-13.46 0-24.4 10.84-24.4 24.13 0 4.55 1.3 9 3.74 12.83l.58.92-2.86 10.4 10.05-2.7z'
      />
      <path
        fill='#fff'
        fillRule='evenodd'
        d='M44.6 17.97c-.55-1.2-1.13-1.23-1.65-1.25l-1.4-.02c-.5 0-1.28.18-1.96.91-.67.74-2.57 2.5-2.57 6.07s2.63 7.04 3 7.53c.36.5 5.06 7.97 12.5 10.86 6.18 2.4 7.45 1.93 8.79 1.8 1.34-.12 4.32-1.74 4.93-3.43.6-1.69.6-3.13.42-3.43-.18-.3-.67-.49-1.4-.85-.74-.37-4.32-2.11-4.99-2.36-.67-.24-1.16-.36-1.65.37-.49.73-1.9 2.36-2.32 2.85-.43.49-.86.55-1.6.18-.73-.36-3.07-1.13-5.85-3.59-2.16-1.92-3.62-4.28-4.05-5.01-.42-.73-.04-1.13.32-1.5.33-.32.74-.85 1.1-1.27.37-.42.5-.73.74-1.22s.12-.92-.06-1.28c-.18-.37-1.59-3.96-2.23-5.39h-.07z'
      />
    </svg>
  ),
};

/* --------------------------------- Sub-views --------------------------------- */

function StatusBar({ time }: { time?: string }) {
  return (
    <div
      style={{
        height: 44,
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px 0 24px',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: '#000', letterSpacing: -0.3 }}>
        {time || '9:41'}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width='17' height='12' viewBox='0 0 17 12' fill='none' aria-hidden>
          <rect x='0' y='8' width='3' height='4' rx='1' fill='#000' />
          <rect x='4.5' y='5.5' width='3' height='6.5' rx='1' fill='#000' />
          <rect x='9' y='3' width='3' height='9' rx='1' fill='#000' />
          <rect x='13.5' y='0' width='3' height='12' rx='1' fill='#000' />
        </svg>
        <svg width='16' height='12' viewBox='0 0 16 12' fill='none' aria-hidden>
          <path d='M8 9a1.5 1.5 0 100 3 1.5 1.5 0 000-3z' fill='#000' />
          <path
            d='M3.7 6.3C5.1 4.7 6.5 4 8 4s2.9.7 4.3 2.3'
            stroke='#000'
            strokeWidth='1.5'
            strokeLinecap='round'
            fill='none'
          />
          <path
            d='M1.1 3.5C3 1.3 5.4 0 8 0s5 1.3 6.9 3.5'
            stroke='#000'
            strokeWidth='1.5'
            strokeLinecap='round'
            fill='none'
            opacity='.4'
          />
        </svg>
        <svg width='25' height='12' viewBox='0 0 25 12' fill='none' aria-hidden>
          <rect x='.5' y='.5' width='21' height='11' rx='3.5' stroke='#000' strokeOpacity='.35' />
          <rect x='22.5' y='3.5' width='2' height='5' rx='1' fill='#000' fillOpacity='.4' />
          <rect x='1.5' y='1.5' width='18' height='9' rx='2' fill='#000' />
        </svg>
      </div>
    </div>
  );
}

function ChatHeader({
  contactName,
  contactInitial,
  contactColor,
}: {
  contactName: string;
  contactInitial: string;
  contactColor: string;
}) {
  return (
    <div
      style={{
        background: 'white',
        padding: '8px 16px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
        borderBottom: '0.5px solid #E9EDEF',
      }}
    >
      <button
        type='button'
        aria-label='Back'
        style={{
          background: 'none',
          border: 'none',
          padding: '4px 6px 4px 0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Ic.Back />
      </button>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: contactColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ color: 'white', fontSize: 16, fontWeight: 600 }}>{contactInitial}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#111B21',
            letterSpacing: -0.2,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={contactName}
        >
          {contactName}
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#667781',
            marginTop: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          tap here for contact info
        </div>
      </div>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        <Ic.Video />
        <Ic.Phone />
      </div>
    </div>
  );
}

function DateChip({ date }: { date: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 8px' }}>
      <div
        style={{
          background: 'rgba(255,255,255,0.92)',
          borderRadius: 8,
          padding: '4px 12px',
          fontSize: 12,
          color: '#667781',
          fontWeight: 500,
          boxShadow: '0 1px 0.5px rgba(11,20,26,.1)',
        }}
      >
        {date}
      </div>
    </div>
  );
}

function CtaButton({ btn, isLast }: { btn: PreviewButton; isLast: boolean }) {
  const icons: Partial<Record<PreviewButton['type'], React.ReactNode>> = {
    URL: <Ic.Link />,
    PHONE: <Ic.PhoneBtn />,
    COPY_CODE: <Ic.Copy />,
  };
  return (
    <button
      type='button'
      className='template-whatsapp-template-action'
      style={{
        width: '100%',
        background: 'white',
        border: 'none',
        borderTop: '1px solid #E9EDEF',
        padding: '11px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        color: '#027EB5',
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
        borderRadius: isLast ? '0 0 7px 7px' : 0,
        fontFamily: FONT_STACK,
      }}
    >
      {icons[btn.type] ? <span style={{ display: 'flex', opacity: 0.9 }}>{icons[btn.type]}</span> : null}
      {btn.label}
    </button>
  );
}

function QuickReplyBubbles({ buttons }: { buttons: PreviewButton[] }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
      {buttons.map((btn, i) => (
        <button
          key={i}
          type='button'
          style={{
            background: 'white',
            border: 'none',
            borderRadius: 7,
            padding: '9px 16px',
            boxShadow: '0 1px 0.5px rgba(11,20,26,.13)',
            color: '#027EB5',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: FONT_STACK,
          }}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

function MessageBubble({
  header,
  paragraphs,
  footer,
  time,
  ctaButtons,
  quickReplies,
}: {
  header?: string;
  paragraphs: string[];
  footer?: string;
  time: string;
  ctaButtons: PreviewButton[];
  quickReplies: PreviewButton[];
}) {
  const hasButtons = ctaButtons.length > 0;
  const hasHeader = Boolean(header);

  return (
    <div className='template-whatsapp-message-stack' style={{ maxWidth: 295 }}>
      <div
        className='template-whatsapp-template-card'
        style={{
          background: 'white',
          borderRadius: hasButtons ? '7px 7px 0 0' : '0 7px 7px 7px',
          boxShadow: '0 1px 0.5px rgba(11,20,26,.13)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {!hasHeader ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              left: -7,
              width: 0,
              height: 0,
              borderTop: '8px solid white',
              borderLeft: '8px solid transparent',
              filter: 'drop-shadow(-1px 0 0.5px rgba(11,20,26,.06))',
            }}
          />
        ) : null}

        {hasHeader ? (
          <div
            className='template-whatsapp-template-header'
            style={{
              padding: '10px 14px 0',
              fontSize: 15,
              fontWeight: 700,
              color: '#111B21',
              lineHeight: 1.35,
              fontFamily: FONT_STACK,
            }}
          >
            {header}
          </div>
        ) : null}

        <div
          className='template-whatsapp-template-card-body'
          style={{
            padding: hasHeader ? '8px 14px 0' : '10px 14px 0',
            fontSize: 14.5,
            color: '#111B21',
            lineHeight: 1.5,
            fontFamily: FONT_STACK,
            wordBreak: 'break-word',
          }}
        >
          {paragraphs.map((paragraph, idx) => (
            <p
              key={idx}
              className='template-whatsapp-template-paragraph'
              style={{
                margin: idx === 0 ? 0 : '12px 0 0',
                whiteSpace: 'pre-wrap',
              }}
            >
              {parseWAText(paragraph)}
            </p>
          ))}
        </div>

        <div
          className='template-whatsapp-template-meta'
          style={{
            padding: '4px 14px 8px',
            display: 'flex',
            justifyContent: footer ? 'space-between' : 'flex-end',
            alignItems: 'flex-end',
            gap: 8,
            marginTop: 4,
          }}
        >
          {footer ? (
            <div
              className='template-whatsapp-template-footer'
              style={{ fontSize: 12, color: '#667781', lineHeight: 1.3, flex: 1 }}
            >
              {footer}
            </div>
          ) : null}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 11.5, color: '#667781', letterSpacing: 0.1 }}>{time}</span>
            <Ic.Tick2 />
          </div>
        </div>

        {ctaButtons.map((btn, i) => (
          <CtaButton key={i} btn={btn} isLast={i === ctaButtons.length - 1} />
        ))}
      </div>

      {quickReplies.length > 0 ? <QuickReplyBubbles buttons={quickReplies} /> : null}
    </div>
  );
}

function InputBar() {
  const iconButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 2,
    display: 'flex',
  };
  return (
    <div
      style={{
        background: '#F0F2F5',
        padding: '8px 12px 24px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <button type='button' aria-label='Attach' style={iconButtonStyle}>
        <Ic.Plus />
      </button>
      <div
        style={{
          flex: 1,
          background: 'white',
          borderRadius: 24,
          padding: '9px 14px 9px 16px',
          fontSize: 15,
          color: '#8696A0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 0.5px rgba(0,0,0,.08)',
          minHeight: 24,
        }}
      >
        <span>Message</span>
        <Ic.Sticker />
      </div>
      <button type='button' aria-label='Pay' style={iconButtonStyle}>
        <Ic.Rupee />
      </button>
      <button type='button' aria-label='Camera' style={iconButtonStyle}>
        <Ic.Camera />
      </button>
      <button type='button' aria-label='Voice message' style={iconButtonStyle}>
        <Ic.Mic />
      </button>
    </div>
  );
}

/* ------------------------------ Phone container ------------------------------ */

function WhatsAppPhone({
  contactName,
  contactInitial,
  contactColor,
  date,
  children,
}: {
  contactName: string;
  contactInitial: string;
  contactColor: string;
  date: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className='template-whatsapp-preview'
      style={{
        width: 375,
        background: '#1C1C1E',
        borderRadius: 54,
        padding: '10px 8px',
        boxShadow:
          '0 0 0 1px rgba(255,255,255,.08), 0 24px 48px rgba(0,0,0,.45), inset 0 0 0 1.5px rgba(255,255,255,.12)',
        position: 'relative',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: -3,
          top: 110,
          width: 3,
          height: 36,
          background: '#3A3A3C',
          borderRadius: '3px 0 0 3px',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: -3,
          top: 158,
          width: 3,
          height: 64,
          background: '#3A3A3C',
          borderRadius: '3px 0 0 3px',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: -3,
          top: 232,
          width: 3,
          height: 64,
          background: '#3A3A3C',
          borderRadius: '3px 0 0 3px',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -3,
          top: 178,
          width: 3,
          height: 80,
          background: '#3A3A3C',
          borderRadius: '0 3px 3px 0',
        }}
      />

      <div
        className='template-whatsapp-screen'
        style={{
          background: 'white',
          borderRadius: 46,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: 780,
          position: 'relative',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 18,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120,
            height: 34,
            background: '#1C1C1E',
            borderRadius: 20,
            zIndex: 10,
          }}
        />
        <StatusBar />
        <ChatHeader
          contactName={contactName}
          contactInitial={contactInitial}
          contactColor={contactColor}
        />
        <div
          className='template-whatsapp-chat-body wa-scroll'
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            background: '#E5DDD5',
            backgroundImage: `url("${WA_WALLPAPER_URL}")`,
            backgroundSize: '412px auto',
            backgroundRepeat: 'repeat',
            padding: '4px 12px 8px',
          }}
        >
          <DateChip date={date} />
          <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 8 }}>{children}</div>
        </div>
        <InputBar />
      </div>
    </div>
  );
}

/* --------------------------------- Component --------------------------------- */

export default function TemplateWhatsappPreview({
  templateType,
  body,
  variableOptions,
  header,
  footer,
  buttonLabel,
  buttonUrl,
  category,
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

  const resolvedFooter = useMemo(() => (footer ? footer.trim() : ''), [footer]);

  const externalButton = useMemo<PreviewButton | null>(() => {
    if (!buttonLabel?.trim() || !buttonUrl?.trim()) return null;
    const resolvedUrl = resolveTemplatePreviewText(buttonUrl, previewValues).trim();
    const resolvedLabel = resolveTemplatePreviewText(buttonLabel, previewValues).trim();
    return {
      type: 'URL',
      label: resolvedLabel || deriveActionLabel(resolvedUrl, templateType),
      url: resolvedUrl,
    };
  }, [buttonLabel, buttonUrl, previewValues, templateType]);

  const allButtons = externalButton ? [externalButton] : previewModel.buttons;
  const ctaButtons = allButtons.filter((b) => b.type !== 'QUICK_REPLY');
  const quickReplies = allButtons.filter((b) => b.type === 'QUICK_REPLY');

  const hasContent =
    previewModel.paragraphs.length > 0 ||
    Boolean(resolvedHeader) ||
    ctaButtons.length > 0 ||
    quickReplies.length > 0;

  const businessName = EMAIL_TEMPLATE_PREVIEW_CONTEXT.business.name;
  const contactInitial = (businessName.trim()[0] || 'B').toUpperCase();
  const contactColor = '#7D3BDF';
  const time = '5:25 PM';
  const date = 'Today';
  const cat = category || 'UTILITY';
  const catStyle = CATEGORY_STYLE[cat] || CATEGORY_STYLE.UTILITY;
  const templateTitle = resolvedHeader || (businessName ? `${businessName} message` : 'WhatsApp message');

  return (
    <div className='template-preview-stack'>
      <h2 className='template-preview-title'>WhatsApp preview</h2>
      <div
        className='template-whatsapp-preview-frame'
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div
          className='template-whatsapp-preview-meta'
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'white',
            borderRadius: 8,
            padding: '10px 20px',
            boxShadow: '0 1px 3px rgba(36,40,47,.08)',
            width: 375,
            maxWidth: '100%',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              background: '#EEFEF4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ic.WhatsAppGlyph />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#24282F' }}>WhatsApp Preview</div>
            <div
              style={{
                fontSize: 12,
                color: '#696F77',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {templateTitle}
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 99,
              background: catStyle.bg,
              color: catStyle.color,
              letterSpacing: 0.3,
            }}
          >
            {cat}
          </div>
        </div>

        <WhatsAppPhone
          contactName={businessName}
          contactInitial={contactInitial}
          contactColor={contactColor}
          date={date}
        >
          {hasContent ? (
            <MessageBubble
              header={resolvedHeader || undefined}
              paragraphs={previewModel.paragraphs}
              footer={resolvedFooter || undefined}
              time={time}
              ctaButtons={ctaButtons}
              quickReplies={quickReplies}
            />
          ) : (
            <p
              className='template-preview-empty template-preview-empty--chat'
              style={{
                margin: 'auto 18px',
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.85)',
                boxShadow: '0 1px 3px rgba(60,60,67,.18)',
                color: '#3c3c43',
                fontSize: 13,
                lineHeight: 1.5,
                textAlign: 'center',
              }}
            >
              Start writing to preview this WhatsApp message.
            </p>
          )}
        </WhatsAppPhone>
      </div>
    </div>
  );
}
