'use client';

import React, { useEffect, useState } from 'react';

import styles from './InvoiceEmailDrawerPrototype.module.css';

type SampleInvoice = {
  id: string;
  number: string;
  customerName: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  total: string;
  status: string;
};

type TemplateOption = {
  id: string;
  name: string;
  subject: string;
  body: string;
  source: 'saved' | 'fallback';
  documentSubtype: string;
};

type DraftPayload = {
  invoiceId: string;
  templateId: string;
  templateName: string;
  templateSource: 'saved' | 'fallback';
  documentSubtype: string;
  to: string;
  subject: string;
  body: string;
};

const SENDER_IDENTITY_OPTIONS = [
  { value: '', label: 'Select your Email Account' },
  { value: 'billing@refrens.local', label: 'billing@refrens.local' },
  { value: 'standalone@refrens.local', label: 'standalone@refrens.local' },
] as const;

const REPLY_TO_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'accounts@refrens.local', label: 'accounts@refrens.local' },
  { value: 'support@refrens.local', label: 'support@refrens.local' },
] as const;

const DEFAULT_CC_RECIPIENTS = [
  'Mitesh kariya <mitesh@refrens.com>',
  'Janvi <janvi@refrens.com>',
];

async function readJson<T>(response: Response): Promise<T> {
  let payload: unknown;

  try {
    payload = await response.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Unexpected server response. Please refresh the page.');
    }

    throw error;
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? String(payload.message)
        : 'Something went wrong';

    throw new Error(message);
  }

  return payload as T;
}

function getStatusClassName(status: string) {
  if (status === 'PAID') {
    return styles.statusPaid;
  }

  if (status === 'UNPAID') {
    return styles.statusUnpaid;
  }

  if (status === 'PARTIALLY_PAID') {
    return styles.statusPartPaid;
  }

  return styles.statusOther;
}

function getStatusLabel(status: string) {
  if (status === 'PARTIALLY_PAID') {
    return 'Part Paid';
  }

  return status
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function hasManualDraftEdits(draft: DraftPayload | null, resolvedSnapshot: DraftPayload | null) {
  if (!draft || !resolvedSnapshot) {
    return false;
  }

  return draft.subject !== resolvedSnapshot.subject || draft.body !== resolvedSnapshot.body;
}

export function InvoiceEmailDrawerPrototypePage() {
  const [invoices, setInvoices] = useState<SampleInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<SampleInvoice | null>(null);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [draft, setDraft] = useState<DraftPayload | null>(null);
  const [resolvedSnapshot, setResolvedSnapshot] = useState<DraftPayload | null>(null);
  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [senderIdentity, setSenderIdentity] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [attachClientStatement, setAttachClientStatement] = useState(false);
  const [getEmailStatus, setGetEmailStatus] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [drawerError, setDrawerError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const draftIsDirty = hasManualDraftEdits(draft, resolvedSnapshot);

  useEffect(() => {
    let isMounted = true;

    async function loadInvoices() {
      setInvoicesLoading(true);
      setPageError('');

      try {
        const response = await fetch('/api/prototypes/invoice-email-drawer/invoices');
        const payload = await readJson<{ data: SampleInvoice[] }>(response);

        if (!isMounted) {
          return;
        }

        setInvoices(payload.data);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setPageError(error instanceof Error ? error.message : 'Unable to load sample invoices');
      } finally {
        if (isMounted) {
          setInvoicesLoading(false);
        }
      }
    }

    void loadInvoices();

    return () => {
      isMounted = false;
    };
  }, []);

  async function ensureTemplatesLoaded() {
    if (templates.length > 0 || templatesLoading) {
      return;
    }

    setTemplatesLoading(true);
    setDrawerError('');

    try {
      const response = await fetch('/api/prototypes/invoice-email-drawer/templates');
      const payload = await readJson<{ data: TemplateOption[] }>(response);
      setTemplates(payload.data);
    } catch (error) {
      setDrawerError(error instanceof Error ? error.message : 'Unable to load templates');
    } finally {
      setTemplatesLoading(false);
    }
  }

  function resetDraftState() {
    setSelectedTemplateId('');
    setDraft(null);
    setResolvedSnapshot(null);
    setDrawerError('');
    setFeedbackMessage('');
    setIsPreviewOpen(false);
  }

  async function openDrawer(invoice: SampleInvoice) {
    setSelectedInvoice(invoice);
    setClientEmail(invoice.customerEmail);
    setClientName(invoice.customerName);
    setSenderIdentity('');
    setReplyTo('');
    setAttachClientStatement(false);
    setGetEmailStatus(true);
    resetDraftState();
    setIsDrawerOpen(true);
    await ensureTemplatesLoaded();
  }

  function closeDrawer() {
    setIsDrawerOpen(false);
    setSelectedInvoice(null);
    setClientEmail('');
    setClientName('');
    resetDraftState();
  }

  async function applyTemplate(templateId: string) {
    if (!selectedInvoice) {
      return;
    }

    setDraftLoading(true);
    setDrawerError('');
    setFeedbackMessage('');

    try {
      const response = await fetch('/api/prototypes/invoice-email-drawer/draft', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          templateId,
        }),
      });
      const payload = await readJson<DraftPayload>(response);

      setDraft(payload);
      setResolvedSnapshot(payload);
      setClientEmail(payload.to || selectedInvoice.customerEmail);
      setClientName(selectedInvoice.customerName);
    } catch (error) {
      setDrawerError(error instanceof Error ? error.message : 'Unable to resolve the selected template');
    } finally {
      setDraftLoading(false);
    }
  }

  function confirmDiscardEdits() {
    if (!draftIsDirty) {
      return true;
    }

    return window.confirm(
      'Changing the template will discard your manual edits. Do you want to continue?',
    );
  }

  function handleTemplateSelection(nextTemplateId: string) {
    if (nextTemplateId === selectedTemplateId) {
      return;
    }

    if (selectedTemplateId && !confirmDiscardEdits()) {
      return;
    }

    setSelectedTemplateId(nextTemplateId);
    setDraft(null);
    setResolvedSnapshot(null);
    setDrawerError('');
    setFeedbackMessage('');
    setIsPreviewOpen(false);

    if (nextTemplateId) {
      void applyTemplate(nextTemplateId);
    }
  }

  function updateDraftField(field: 'subject' | 'body', value: string) {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        [field]: value,
      };
    });
  }

  function handlePreviewOpen() {
    if (!draft) {
      return;
    }

    setIsPreviewOpen(true);
  }

  function handleSendEmail() {
    setFeedbackMessage('Prototype mode only. No email was sent.');
  }

  function handleScheduleLater() {
    setFeedbackMessage('Scheduling is not wired in this prototype yet.');
  }

  function handleSaveCcForClient() {
    setFeedbackMessage('CC recipients were saved for this client in prototype mode only.');
  }

  const visibleCount = invoices.length;

  return (
    <main className={styles.page}>
      <div className={styles.appShell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarBrand}>▲</div>
          <div className={styles.sidebarIcons}>
            {['◔', '⌂', '¤', '▣', '◫', '⌘', '✦', '⚙', '✎'].map((icon) => (
              <span className={styles.sidebarIcon} key={icon}>
                {icon}
              </span>
            ))}
          </div>
          <div className={styles.sidebarInvite}>⌁</div>
        </aside>

        <section className={styles.workspace}>
          <header className={styles.topBar}>
            <div className={styles.topBarLeft}>
              <span className={styles.menuIcon}>☰</span>
              <span className={styles.logoMark}>▲</span>
              <span className={styles.logoText}>Refrens</span>
            </div>
          </header>

          <div className={`${styles.workspaceContent} ${isDrawerOpen ? styles.workspaceDimmed : ''}`}>
            <div className={styles.screenHeader}>
              <p className={styles.screenMeta}>
                Showing <strong>1</strong> to <strong>{visibleCount}</strong> of{' '}
                <strong>{visibleCount}</strong> Invoices
              </p>
            </div>

            {pageError ? <div className={styles.pageBanner}>{pageError}</div> : null}

            <section className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <span />
                <span>Date</span>
                <span>Invoice</span>
                <span>Billed To</span>
                <span>Currency</span>
                <span>Amount</span>
                <span>Status</span>
              </div>

              {invoicesLoading ? (
                <div className={styles.tableEmpty}>Loading invoices from Mongo...</div>
              ) : null}

              {!invoicesLoading && !pageError && invoices.length === 0 ? (
                <div className={styles.tableEmpty}>No invoices available for the drawer prototype.</div>
              ) : null}

              {!invoicesLoading && invoices.length > 0 ? (
                <div className={styles.tableBody}>
                  {invoices.map((invoice, index) => (
                    <button
                      aria-label={`Open email drawer for ${invoice.number}`}
                      className={`${styles.tableRow} ${
                        selectedInvoice?.id === invoice.id ? styles.tableRowActive : ''
                      }`}
                      key={invoice.id}
                      onClick={() => {
                        void openDrawer(invoice);
                      }}
                      type='button'
                    >
                      <span className={styles.rowIndex}>{index + 1}</span>
                      <span className={styles.rowDate}>{invoice.issueDate}</span>
                      <span className={styles.rowInvoice}>{invoice.number}</span>
                      <span className={styles.rowCustomer}>{invoice.customerName}</span>
                      <span className={styles.rowCurrency}>{invoice.currency}</span>
                      <span className={styles.rowAmount}>
                        {invoice.currency === 'INR' ? '₹' : `${invoice.currency} `}
                        {invoice.total}
                      </span>
                      <span className={`${styles.statusPill} ${getStatusClassName(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </section>
          </div>
        </section>
      </div>

      {isDrawerOpen ? <div className={styles.backdrop} onClick={closeDrawer} /> : null}

      {isDrawerOpen ? (
        <aside
          aria-labelledby='email-invoice-title'
          aria-modal='true'
          className={styles.drawer}
          role='dialog'
        >
          <div className={styles.drawerHeader}>
            <h1 className={styles.drawerTitle} id='email-invoice-title'>
              Email Invoice
            </h1>
            <button
              aria-label='Close email invoice drawer'
              className={styles.closeButton}
              onClick={closeDrawer}
              type='button'
            >
              ×
            </button>
          </div>

          <div className={styles.drawerBody}>
            {drawerError ? <div className={styles.drawerBannerError}>{drawerError}</div> : null}
            {feedbackMessage ? <div className={styles.drawerBannerInfo}>{feedbackMessage}</div> : null}

            <div className={styles.fieldRow}>
              <div className={styles.fieldLabelBlock}>
                <label className={styles.fieldLabel} htmlFor='email-template'>
                  Email Template
                </label>
              </div>
              <div className={styles.fieldControlStack}>
                <select
                  className={styles.selectField}
                  id='email-template'
                  onChange={(event) => {
                    handleTemplateSelection(event.target.value);
                  }}
                  value={selectedTemplateId}
                >
                  <option value=''>
                    {templatesLoading ? 'Loading templates...' : 'Select invoice email template'}
                  </option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <p className={styles.helperText}>
                  Select a template first. Variables are resolved once for{' '}
                  <strong>{selectedInvoice?.number}</strong> and later edits stay static.
                </p>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldLabelBlock}>
                <label className={styles.fieldLabel} htmlFor='sender-identity'>
                  Senders Email
                </label>
              </div>
              <div className={styles.fieldControlStack}>
                <select
                  className={styles.selectField}
                  id='sender-identity'
                  onChange={(event) => {
                    setSenderIdentity(event.target.value);
                  }}
                  value={senderIdentity}
                >
                  {SENDER_IDENTITY_OPTIONS.map((option) => (
                    <option key={option.value || 'empty'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldLabelBlock}>
                <label className={styles.fieldLabel} htmlFor='client-email'>
                  Client Email
                </label>
              </div>
              <div className={styles.fieldControlStack}>
                <input
                  className={styles.textField}
                  id='client-email'
                  onChange={(event) => {
                    setClientEmail(event.target.value);
                  }}
                  type='email'
                  value={clientEmail}
                />
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldLabelBlock}>
                <label className={styles.fieldLabel} htmlFor='client-name'>
                  Client Name
                </label>
              </div>
              <div className={styles.fieldControlStack}>
                <input
                  className={styles.textField}
                  id='client-name'
                  onChange={(event) => {
                    setClientName(event.target.value);
                  }}
                  type='text'
                  value={clientName}
                />
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldLabelBlock}>
                <label className={styles.fieldLabel} htmlFor='reply-to'>
                  Reply To
                </label>
              </div>
              <div className={styles.fieldControlStack}>
                <select
                  className={styles.selectField}
                  id='reply-to'
                  onChange={(event) => {
                    setReplyTo(event.target.value);
                  }}
                  value={replyTo}
                >
                  {REPLY_TO_OPTIONS.map((option) => (
                    <option key={option.value || 'empty'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldLabelBlock}>
                <label className={styles.fieldLabel}>Also Send To</label>
                <span className={styles.fieldSecondaryLabel}>CC Emails</span>
              </div>
              <div className={styles.fieldControlStack}>
                <div className={styles.chipField}>
                  {DEFAULT_CC_RECIPIENTS.map((recipient) => (
                    <span className={styles.ccChip} key={recipient}>
                      {recipient}
                      <span className={styles.ccChipClose}>×</span>
                    </span>
                  ))}
                </div>
                <button
                  className={styles.inlineLinkButton}
                  onClick={handleSaveCcForClient}
                  type='button'
                >
                  Save CC for Client
                </button>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldLabelBlock}>
                <label className={styles.fieldLabel} htmlFor='email-subject'>
                  Email Subject
                </label>
              </div>
              <div className={styles.fieldControlStack}>
                <input
                  className={styles.textField}
                  disabled={!draft && !draftLoading}
                  id='email-subject'
                  onChange={(event) => {
                    updateDraftField('subject', event.target.value);
                  }}
                  placeholder='Select a template to generate the email subject'
                  type='text'
                  value={draft?.subject || ''}
                />
              </div>
            </div>

            <div className={styles.messageSection}>
              <div className={styles.messageHeader}>
                <label className={styles.fieldLabel} htmlFor='email-message'>
                  Message
                </label>
                <button
                  className={styles.inlineLinkButton}
                  disabled={!draft}
                  onClick={handlePreviewOpen}
                  type='button'
                >
                  See Preview
                </button>
              </div>
              <textarea
                className={styles.textArea}
                disabled={!draft && !draftLoading}
                id='email-message'
                onChange={(event) => {
                  updateDraftField('body', event.target.value);
                }}
                placeholder='Select a template to resolve invoice variables.'
                value={draft?.body || ''}
              />
            </div>

            <div className={styles.attachmentNote}>
              <span className={styles.noteIcon}>📎</span>
              <span>Invoice PDF attachment and Online Link will be added to the email automatically.</span>
            </div>

            <label className={styles.checkboxRow}>
              <input
                checked={attachClientStatement}
                onChange={(event) => {
                  setAttachClientStatement(event.target.checked);
                }}
                type='checkbox'
              />
              <span>Attach Client Statement</span>
            </label>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxRow}>
                <input
                  checked={getEmailStatus}
                  onChange={(event) => {
                    setGetEmailStatus(event.target.checked);
                  }}
                  type='checkbox'
                />
                <span>Get Email Status</span>
              </label>
              <p className={styles.receiptHint}>Email receipt will be sent to</p>
            </div>
          </div>

          <div className={styles.drawerFooter}>
            <button
              className={styles.primaryButton}
              disabled={!draft || draftLoading}
              onClick={handleSendEmail}
              type='button'
            >
              Send Email
            </button>
            <button
              className={styles.secondaryButton}
              disabled={!draft || draftLoading}
              onClick={handleScheduleLater}
              type='button'
            >
              Schedule for later
            </button>
            <button className={styles.tertiaryButton} onClick={closeDrawer} type='button'>
              Cancel
            </button>
          </div>
        </aside>
      ) : null}

      {isPreviewOpen && draft ? (
        <div className={styles.previewOverlay}>
          <div className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <h2 className={styles.previewTitle}>Email Preview</h2>
              <button
                aria-label='Close email preview'
                className={styles.closeButton}
                onClick={() => {
                  setIsPreviewOpen(false);
                }}
                type='button'
              >
                ×
              </button>
            </div>
            <div className={styles.previewBody}>
              <p className={styles.previewMeta}>
                <strong>To:</strong> {clientEmail || draft.to}
              </p>
              <p className={styles.previewMeta}>
                <strong>Subject:</strong> {draft.subject}
              </p>
              <pre className={styles.previewMessage}>{draft.body}</pre>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
