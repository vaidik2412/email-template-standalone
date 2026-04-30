'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { EMAIL_TEMPLATE_TYPES } from '@/data/email/templateTypes';
import type { SerializedMessageTemplate } from '@/types/messageTemplate';

import { useTemplates } from './hooks/useTemplates';
import { useRefreshTemplateStatus } from './hooks/useRefreshTemplateStatus';

function renderWaStatusBadge(template: SerializedMessageTemplate) {
  if (template.channel !== 'WHATSAPP') return null;
  const raw = (template.whatsapp?.status || 'PENDING').toUpperCase();
  const cls = `template-wa-status template-wa-status--${raw.toLowerCase()}`;
  return <span className={cls}>{raw}</span>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function renderStatus(template: SerializedMessageTemplate) {
  if (template.isArchived) {
    return 'Inactive';
  }

  return template.status;
}

function renderChannelLabel(channel: SerializedMessageTemplate['channel']) {
  return channel === 'WHATSAPP' ? 'WhatsApp' : 'Email';
}

export default function TemplatesDashboard() {
  const { templates, isLoading, error, activeTemplateId, patchTemplate, fetchTemplates } =
    useTemplates();
  const { refresh: refreshStatus, isRefreshing: refreshingTemplateId } =
    useRefreshTemplateStatus();
  const [statusToast, setStatusToast] = useState<{
    name: string;
    status: string;
    changed: boolean;
    at: number;
  } | null>(null);

  useEffect(() => {
    if (!statusToast) return;
    const timer = window.setTimeout(() => setStatusToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [statusToast]);

  const handleRefreshStatus = async (template: SerializedMessageTemplate) => {
    const previousStatus = (template.whatsapp?.status || 'PENDING').toUpperCase();
    const next = await refreshStatus(template._id);
    if (next) {
      const newStatus = (next.whatsapp?.status || 'PENDING').toUpperCase();
      setStatusToast({
        name: next.name,
        status: newStatus,
        changed: newStatus !== previousStatus,
        at: Date.now(),
      });
      void fetchTemplates();
    }
  };

  const totalTemplatesLabel = useMemo(() => {
    if (!templates.length) {
      return 'No templates yet';
    }

    return `${templates.length} template${templates.length === 1 ? '' : 's'}`;
  }, [templates.length]);

  return (
    <main className='dashboard-shell'>
      {statusToast ? (
        <div
          key={statusToast.at}
          className={`template-status-toast template-status-toast--${statusToast.status.toLowerCase()}`}
          role='status'
          aria-live='polite'
        >
          {statusToast.changed
            ? `${statusToast.name}: status updated to ${statusToast.status}.`
            : `${statusToast.name}: still ${statusToast.status}.`}
        </div>
      ) : null}
      <section className='dashboard-hero'>
        <div>
          <p className='eyebrow'>Settings / Templates</p>
          <h1>Message templates</h1>
          <p className='hero-copy'>
            Manage the email and WhatsApp templates your single demo business can draft, publish,
            archive, duplicate, and remove.
          </p>
        </div>
        <Link href='/templates/new' className='primary-cta'>
          Create new template
        </Link>
      </section>

      <section className='dashboard-panel'>
        <div className='panel-header'>
          <div>
            <h2>Template dashboard</h2>
            <p>{totalTemplatesLabel}</p>
          </div>
        </div>

        {error ? <div className='inline-error'>{error}</div> : null}
        {isLoading ? <div className='dashboard-empty'>Loading templates...</div> : null}

        {!isLoading && !templates.length ? (
          <div className='dashboard-empty'>
            <h3>Default templates will appear here</h3>
            <p>Create your first custom template or refresh once the API is connected to MongoDB.</p>
          </div>
        ) : null}

        {!isLoading && templates.length ? (
          <div className='table-shell'>
            <table className='templates-table'>
              <thead>
                <tr>
                  <th>Template Name</th>
                  <th>Channel</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>WA Approval</th>
                  <th>Created By</th>
                  <th>Unpublished Changes</th>
                  <th>Subject</th>
                  <th>Created On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template._id}>
                    <td>{template.name}</td>
                    <td>
                      <span
                        className={`template-channel-badge template-channel-badge--${template.channel.toLowerCase()}`}
                      >
                        {renderChannelLabel(template.channel)}
                      </span>
                    </td>
                    <td>{EMAIL_TEMPLATE_TYPES[template.templateType]?.label || template.templateType}</td>
                    <td>{renderStatus(template)}</td>
                    <td>
                      {template.channel === 'WHATSAPP' ? (
                        <div className='template-wa-status-cell'>
                          {renderWaStatusBadge(template)}
                          {template.status === 'LIVE' &&
                          (template.whatsapp?.status || '').toUpperCase() !== 'APPROVED' ? (
                            <button
                              type='button'
                              className='template-wa-refresh'
                              aria-label='Refresh WhatsApp approval status'
                              title='Refresh WhatsApp approval status'
                              disabled={refreshingTemplateId === template._id}
                              onClick={() => {
                                void handleRefreshStatus(template);
                              }}
                            >
                              {refreshingTemplateId === template._id ? '⟳' : '↻'}
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <span className='template-wa-status-cell-empty'>—</span>
                      )}
                    </td>
                    <td>{template.createdBy?.name || 'Default'}</td>
                    <td>{template.isModifiedPostPublish ? 'Yes' : 'No'}</td>
                    <td>{template.channel === 'WHATSAPP' ? 'Not used for WhatsApp' : template.subject}</td>
                    <td>{formatDate(template.createdAt)}</td>
                    <td>
                      <div className='table-actions'>
                        <Link href={`/templates/${template._id}/edit`} className='inline-link-button'>
                          Edit
                        </Link>
                        <Link
                          href={`/templates/new?copyFrom=${template._id}`}
                          className='inline-link-button'
                        >
                          Duplicate
                        </Link>
                        <button
                          type='button'
                          className='inline-secondary-button'
                          disabled={activeTemplateId === template._id}
                          onClick={() => {
                            void patchTemplate(template._id, {
                              isArchived: !template.isArchived,
                            });
                          }}
                        >
                          {template.isArchived ? 'Activate' : 'Archive'}
                        </button>
                        <button
                          type='button'
                          className='inline-danger-button'
                          disabled={activeTemplateId === template._id}
                          onClick={() => {
                            void patchTemplate(template._id, {
                              isRemoved: true,
                            });
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}
