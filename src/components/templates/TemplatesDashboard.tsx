'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';

import { EMAIL_TEMPLATE_TYPES } from '@/data/email/templateTypes';
import type { SerializedMessageTemplate } from '@/types/messageTemplate';

import { useTemplates } from './hooks/useTemplates';

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

export default function TemplatesDashboard() {
  const { templates, isLoading, error, activeTemplateId, patchTemplate } = useTemplates();

  const totalTemplatesLabel = useMemo(() => {
    if (!templates.length) {
      return 'No templates yet';
    }

    return `${templates.length} template${templates.length === 1 ? '' : 's'}`;
  }, [templates.length]);

  return (
    <main className='dashboard-shell'>
      <section className='dashboard-hero'>
        <div>
          <p className='eyebrow'>Settings / Emails</p>
          <h1>Email templates</h1>
          <p className='hero-copy'>
            Manage the custom email templates your single demo business can draft, publish, archive,
            duplicate, and remove.
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
                  <th>Category</th>
                  <th>Status</th>
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
                    <td>{EMAIL_TEMPLATE_TYPES[template.templateType]?.label || template.templateType}</td>
                    <td>{renderStatus(template)}</td>
                    <td>{template.createdBy?.name || 'Default'}</td>
                    <td>{template.isModifiedPostPublish ? 'Yes' : 'No'}</td>
                    <td>{template.subject}</td>
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
