'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useFormik } from 'formik';

import { ENABLED_EMAIL_TEMPLATE_TYPE_KEYS, EMAIL_TEMPLATE_TYPES } from '@/data/email/templateTypes';
import type { SerializedMessageTemplate, TemplateWritePayload } from '@/types/messageTemplate';
import { removeMarkdownEditorsInternalVariables } from '@/utils/removeMarkdownEditorsInternalVariables';

import { templateFormSchema } from './templateFormSchema';
import TemplateMarkdownEditor from './TemplateMarkdownEditor';
import TemplateMarkdownViewer from './TemplateMarkdownViewer';
import { useTemplateFormSubmit } from './hooks/useTemplateFormSubmit';

type TemplateFormScreenProps = {
  mode: 'create' | 'edit';
  templateId?: string;
  copyFromId?: string;
};

type TemplateFormValues = {
  name: string;
  subject: string;
  body: string;
  templateType: (typeof ENABLED_EMAIL_TEMPLATE_TYPE_KEYS)[number];
  isArchived: boolean;
};

const defaultValues: TemplateFormValues = {
  name: '',
  subject: '',
  body: '',
  templateType: ENABLED_EMAIL_TEMPLATE_TYPE_KEYS[0],
  isArchived: false,
};

const FIXED_BUSINESS_NAME = 'Refrens Demo';

function getDuplicateValues(template: SerializedMessageTemplate): TemplateFormValues {
  const source =
    template.published && !template.isModifiedPostPublish
      ? {
          ...template,
          ...template.published,
        }
      : template;

  return {
    name: `[DUPLICATE] ${source.name}`,
    subject: source.subject,
    body: source.body,
    templateType: source.templateType,
    isArchived: false,
  };
}

function getEditValues(template: SerializedMessageTemplate): TemplateFormValues {
  return {
    name: template.name,
    subject: template.subject,
    body: template.body,
    templateType: template.templateType,
    isArchived: template.isArchived,
  };
}

function TemplateBreadcrumbs() {
  return (
    <nav className='template-breadcrumbs' aria-label='Breadcrumb'>
      <span>Dashboard</span>
      <span className='template-breadcrumb-separator'>›</span>
      <span>Business Settings</span>
      <span className='template-breadcrumb-separator'>›</span>
      <span>Email Templates</span>
    </nav>
  );
}

type TemplateHeaderActionsProps = {
  disabled: boolean;
  isMenuOpen: boolean;
  isSubmitting: boolean;
  onToggleMenu: () => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
};

function TemplateHeaderActions({
  disabled,
  isMenuOpen,
  isSubmitting,
  onToggleMenu,
  onPublish,
  onSaveDraft,
  containerRef,
}: TemplateHeaderActionsProps) {
  return (
    <div className='template-header-actions' ref={containerRef}>
      <button
        type='button'
        className='template-publish-button'
        disabled={disabled || isSubmitting}
        onClick={onPublish}
      >
        ✓ Publish Template
      </button>
      <button
        type='button'
        className='template-publish-menu-button'
        aria-label='More template actions'
        aria-expanded={isMenuOpen}
        disabled={disabled || isSubmitting}
        onClick={onToggleMenu}
      >
        ▾
      </button>
      {isMenuOpen ? (
        <div className='template-actions-menu'>
          <button type='button' className='template-actions-menu-item' onClick={onSaveDraft}>
            Save as Draft
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function TemplateFormScreen({
  mode,
  templateId,
  copyFromId,
}: TemplateFormScreenProps) {
  const [initialValues, setInitialValues] = useState<TemplateFormValues>(defaultValues);
  const [isBootstrapping, setIsBootstrapping] = useState(mode === 'edit' || Boolean(copyFromId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedTemplate, setLoadedTemplate] = useState<SerializedMessageTemplate | null>(null);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  const { submitTemplate, submitError, isSubmitting } = useTemplateFormSubmit({
    mode,
    templateId,
  });

  useEffect(() => {
    const handleWindowClick = (event: MouseEvent) => {
      if (!actionsRef.current?.contains(event.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handleWindowClick);

    return () => {
      window.removeEventListener('mousedown', handleWindowClick);
    };
  }, []);

  useEffect(() => {
    const fetchSourceTemplate = async () => {
      const sourceTemplateId = mode === 'edit' ? templateId : copyFromId;

      if (!sourceTemplateId) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const response = await fetch(`/api/templates/${sourceTemplateId}`, {
          cache: 'no-store',
        });
        const template = (await response.json()) as SerializedMessageTemplate & {
          message?: string;
        };

        if (!response.ok) {
          throw new Error(template.message || 'Unable to load template');
        }

        setLoadedTemplate(template);
        setInitialValues(mode === 'edit' ? getEditValues(template) : getDuplicateValues(template));
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Unable to load template');
      } finally {
        setIsBootstrapping(false);
      }
    };

    void fetchSourceTemplate();
  }, [copyFromId, mode, templateId]);

  const formik = useFormik<TemplateFormValues>({
    enableReinitialize: true,
    initialValues,
    validationSchema: templateFormSchema,
    onSubmit: async (values) => {
      await submitTemplate(
        {
          ...values,
          body: removeMarkdownEditorsInternalVariables(values.body),
        },
        true,
      );
    },
  });

  const previewBody = useMemo(
    () => removeMarkdownEditorsInternalVariables(formik.values.body).trim(),
    [formik.values.body],
  );

  const isPublishDisabled =
    isSubmitting || (!formik.dirty && !(loadedTemplate?.isModifiedPostPublish || false));

  const handleDraftSave = async () => {
    setIsActionsMenuOpen(false);

    const errors = await formik.validateForm();

    if (Object.keys(errors).length) {
      formik.setTouched({
        name: true,
        subject: true,
        body: true,
        templateType: true,
      });
      return;
    }

    await submitTemplate(
      {
        ...formik.values,
        body: removeMarkdownEditorsInternalVariables(formik.values.body),
      } as TemplateWritePayload,
      false,
    );
  };

  const handlePublish = async () => {
    const errors = await formik.validateForm();

    if (Object.keys(errors).length) {
      formik.setTouched({
        name: true,
        subject: true,
        body: true,
        templateType: true,
      });
      return;
    }

    await formik.submitForm();
  };

  if (isBootstrapping) {
    return (
      <main className='template-screen-shell'>
        <div className='template-header-bar'>
          <div className='template-header-left'>
            <button type='button' className='template-back-button' aria-hidden>
              ←
            </button>
            <div>
              <TemplateBreadcrumbs />
              <h1 className='template-page-title'>Create New Template</h1>
            </div>
          </div>
        </div>
        <div className='template-content-grid'>
          <div className='template-form-card'>Loading template...</div>
        </div>
      </main>
    );
  }

  return (
    <main className='template-screen-shell'>
      <div className='template-header-bar'>
        <div className='template-header-left'>
          <Link href='/templates' className='template-back-button' aria-label='Back to templates'>
            ←
          </Link>
          <div>
            <TemplateBreadcrumbs />
            <h1 className='template-page-title'>
              {mode === 'edit' ? 'Edit Template' : 'Create New Template'}
            </h1>
          </div>
        </div>

        <TemplateHeaderActions
          disabled={isPublishDisabled}
          isMenuOpen={isActionsMenuOpen}
          isSubmitting={isSubmitting}
          onToggleMenu={() => {
            setIsActionsMenuOpen((currentValue) => !currentValue);
          }}
          onPublish={() => {
            void handlePublish();
          }}
          onSaveDraft={() => {
            void handleDraftSave();
          }}
          containerRef={actionsRef}
        />
      </div>

      {loadError ? <div className='template-inline-error'>{loadError}</div> : null}

      <div className='template-content-grid template-content-grid--with-preview'>
        <section className='template-form-card'>
          <form id='template-form' className='template-form-stack' onSubmit={formik.handleSubmit}>
            <div className='field-group'>
              <label className='field-label' htmlFor='templateType'>
                Category
                <span>*</span>
              </label>
              <p className='helper-text'>Define when do you want to use this template.</p>
              <select
                id='templateType'
                name='templateType'
                className='select-input'
                value={formik.values.templateType}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-label='Category'
              >
                {ENABLED_EMAIL_TEMPLATE_TYPE_KEYS.map((templateType) => (
                  <option key={templateType} value={templateType}>
                    {EMAIL_TEMPLATE_TYPES[templateType].label}
                  </option>
                ))}
              </select>
              {formik.touched.templateType && formik.errors.templateType ? (
                <div className='field-error'>{formik.errors.templateType}</div>
              ) : null}
            </div>

            <div className='field-group'>
              <label className='field-label' htmlFor='name'>
                Template Name
                <span>*</span>
              </label>
              <p className='helper-text'>A precise name that you can find this template quickly.</p>
              <input
                id='name'
                name='name'
                className='text-input'
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-label='Template Name'
              />
              {formik.touched.name && formik.errors.name ? (
                <div className='field-error'>{formik.errors.name}</div>
              ) : null}
            </div>

            <div className='field-group'>
              <label className='field-label' htmlFor='subject'>
                Email Subject
                <span>*</span>
              </label>
              <input
                id='subject'
                name='subject'
                className='text-input'
                value={formik.values.subject}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-label='Email Subject'
              />
              {formik.touched.subject && formik.errors.subject ? (
                <div className='field-error'>{formik.errors.subject}</div>
              ) : null}
            </div>

            <TemplateMarkdownEditor
              id='body'
              label='Email Body'
              value={formik.values.body}
              onChange={(nextValue) => {
                void formik.setFieldValue('body', nextValue);
              }}
              error={formik.touched.body ? formik.errors.body : undefined}
            />

            {submitError ? <div className='template-inline-error'>{submitError}</div> : null}
          </form>
        </section>

        <aside className='template-preview-panel'>
          <h2 className='template-preview-title'>Email preview</h2>
          <div className='template-preview-card'>
            {previewBody ? (
              <TemplateMarkdownViewer value={previewBody} />
            ) : (
              <p className='template-preview-empty'>Start writing to preview this email.</p>
            )}
            <div className='template-preview-footer'>
              <p>
                <strong>Regards</strong>
              </p>
              <p>{FIXED_BUSINESS_NAME}</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
