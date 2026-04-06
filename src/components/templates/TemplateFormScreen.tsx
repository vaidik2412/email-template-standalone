'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useFormik } from 'formik';

import {
  ACCOUNTING_DOCUMENT_SUBTYPES,
  ACCOUNTING_DOCUMENT_SUBTYPE_KEYS,
  type DocumentTemplateSubtypeKey,
} from '@/data/email/documentSubtypes';
import type { IndexedCustomFieldsByCategory } from '@/data/email/templateVariables';
import {
  buildTemplateVariableCatalog,
  getDocumentShareLinkCtaLabel,
} from '@/data/email/templateVariables';
import { ENABLED_EMAIL_TEMPLATE_TYPE_KEYS, EMAIL_TEMPLATE_TYPES } from '@/data/email/templateTypes';
import type { SerializedMessageTemplate, TemplateWritePayload } from '@/types/messageTemplate';
import type { TemplateVariableOption } from '@/types/templateVariable';
import { removeMarkdownEditorsInternalVariables } from '@/utils/removeMarkdownEditorsInternalVariables';
import { buildTemplateCtaToken } from '@/utils/templateCtas';
import { getTemplateFieldValidationError } from '@/utils/templateFieldValidation';
import { getTemplateVariableToken } from './templatePreviewUtils';

import { templateFormSchema } from './templateFormSchema';
import TemplateEmailPreview from './TemplateEmailPreview';
import TemplateMarkdownEditor from './TemplateMarkdownEditor';
import TemplatePlainTextEditor from './TemplatePlainTextEditor';
import TemplateVariableMenuButton from './TemplateVariableMenuButton';
import TemplateWhatsappPreview from './TemplateWhatsappPreview';
import { useTemplateFormSubmit } from './hooks/useTemplateFormSubmit';
import {
  DEFAULT_EMAIL_SIGNATURE,
  composeTemplateBodyWithSignature,
  splitTemplateBodySections,
} from './templateBodySections';
import { insertTemplateVariableAtSelection } from './templatePreviewUtils';
import type {
  TemplateVariableInsertionRequest,
  TemplateVariableTarget,
} from './templateVariableInsertion';
import AiTemplatePrompt from './AiTemplatePrompt';
import { WHATSAPP_LANGUAGES } from '@/data/whatsapp/languages';

type TemplateFormScreenProps = {
  mode: 'create' | 'edit';
  templateId?: string;
  copyFromId?: string;
  indexedCustomFields?: IndexedCustomFieldsByCategory;
};

type WhatsappCategory = 'MARKETING' | 'UTILITY';

type TemplateFormValues = {
  channel: SerializedMessageTemplate['channel'];
  name: string;
  subject: string;
  body: string;
  signature: string;
  templateType: (typeof ENABLED_EMAIL_TEMPLATE_TYPE_KEYS)[number];
  documentSubtype: DocumentTemplateSubtypeKey | '';
  isArchived: boolean;
  whatsappCategory: WhatsappCategory;
  whatsappLanguage: string;
  whatsappHeader: string;
  whatsappFooter: string;
  whatsappButtonLabel: string;
  whatsappButtonUrl: string;
};

const defaultValues: TemplateFormValues = {
  channel: 'EMAIL',
  name: '',
  subject: '',
  body: '',
  signature: DEFAULT_EMAIL_SIGNATURE,
  templateType: ENABLED_EMAIL_TEMPLATE_TYPE_KEYS[0],
  documentSubtype: '',
  isArchived: false,
  whatsappCategory: 'MARKETING',
  whatsappLanguage: 'en',
  whatsappHeader: '',
  whatsappFooter: '',
  whatsappButtonLabel: '',
  whatsappButtonUrl: '',
};

function getDuplicateValues(template: SerializedMessageTemplate): TemplateFormValues {
  const source =
    template.published && !template.isModifiedPostPublish
      ? {
          ...template,
          ...template.published,
        }
      : template;
  const bodySections =
    source.channel === 'WHATSAPP'
      ? {
          body: source.body,
          signature: DEFAULT_EMAIL_SIGNATURE,
        }
      : splitTemplateBodySections(source.body);

  return {
    channel: source.channel,
    name: `[DUPLICATE] ${source.name}`,
    subject: source.subject || '',
    body: bodySections.body,
    signature: bodySections.signature,
    templateType: source.templateType,
    documentSubtype: source.documentSubtype || '',
    isArchived: false,
    whatsappCategory: source.whatsapp?.category || 'MARKETING',
    whatsappLanguage: source.whatsapp?.language || 'en',
    whatsappHeader: source.whatsapp?.header || '',
    whatsappFooter: source.whatsapp?.footer || '',
    whatsappButtonLabel: source.whatsapp?.button?.label || '',
    whatsappButtonUrl: source.whatsapp?.button?.url || '',
  };
}

function getEditValues(template: SerializedMessageTemplate): TemplateFormValues {
  const bodySections =
    template.channel === 'WHATSAPP'
      ? {
          body: template.body,
          signature: DEFAULT_EMAIL_SIGNATURE,
        }
      : splitTemplateBodySections(template.body);

  return {
    channel: template.channel,
    name: template.name,
    subject: template.subject || '',
    body: bodySections.body,
    signature: bodySections.signature,
    templateType: template.templateType,
    documentSubtype: template.documentSubtype || '',
    isArchived: template.isArchived,
    whatsappCategory: template.whatsapp?.category || 'MARKETING',
    whatsappLanguage: template.whatsapp?.language || 'en',
    whatsappHeader: template.whatsapp?.header || '',
    whatsappFooter: template.whatsapp?.footer || '',
    whatsappButtonLabel: template.whatsapp?.button?.label || '',
    whatsappButtonUrl: template.whatsapp?.button?.url || '',
  };
}

function TemplateBreadcrumbs() {
  return (
    <nav className='template-breadcrumbs' aria-label='Breadcrumb'>
      <span>Dashboard</span>
      <span className='template-breadcrumb-separator'>›</span>
      <span>Business Settings</span>
      <span className='template-breadcrumb-separator'>›</span>
      <span>Message Templates</span>
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
  indexedCustomFields = {},
}: TemplateFormScreenProps) {
  const [initialValues, setInitialValues] = useState<TemplateFormValues>(defaultValues);
  const [isBootstrapping, setIsBootstrapping] = useState(mode === 'edit' || Boolean(copyFromId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedTemplate, setLoadedTemplate] = useState<SerializedMessageTemplate | null>(null);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [activeVariableTarget, setActiveVariableTarget] = useState<TemplateVariableTarget>('subject');
  const [pendingBodyVariableInsertion, setPendingBodyVariableInsertion] =
    useState<TemplateVariableInsertionRequest | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLTextAreaElement>(null);
  const variableInsertionRequestIdRef = useRef(0);
  const subjectSelectionRef = useRef<{ start: number | null; end: number | null }>({
    start: null,
    end: null,
  });
  const signatureSelectionRef = useRef<{ start: number | null; end: number | null }>({
    start: null,
    end: null,
  });
  const pendingSubjectSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const pendingSignatureSelectionRef = useRef<{ start: number; end: number } | null>(null);

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
    validate: (values) => {
      const errors: Partial<Record<keyof TemplateFormValues, string>> = {};
      const allowedVariableKeys = buildTemplateVariableCatalog({
        templateType: values.templateType,
        documentSubtype:
          values.templateType === 'ACCOUNTING_DOCUMENTS' && values.documentSubtype
            ? values.documentSubtype
            : undefined,
        indexedCustomFields,
      }).options.map((option) => option.value);

      if (values.channel === 'EMAIL') {
        const subjectError = getTemplateFieldValidationError({
          channel: values.channel,
          fieldKind: 'subject',
          value: values.subject,
          allowedVariableKeys,
        });
        if (subjectError) {
          errors.subject = subjectError;
        }
      }

      const bodyError = getTemplateFieldValidationError({
        channel: values.channel,
        fieldKind: 'body',
        value: values.body,
        allowedVariableKeys,
      });
      if (bodyError) {
        errors.body = bodyError;
      }

      if (values.channel === 'EMAIL') {
        const signatureError = getTemplateFieldValidationError({
          channel: values.channel,
          fieldKind: 'signature',
          value: values.signature,
          allowedVariableKeys,
        });
        if (signatureError) {
          errors.signature = signatureError;
        }
      }

      if (values.channel === 'WHATSAPP') {
        if (values.whatsappHeader && values.whatsappHeader.length > 60) {
          errors.whatsappHeader = 'Header must be at most 60 characters.';
        }
        if (values.whatsappFooter && values.whatsappFooter.length > 60) {
          errors.whatsappFooter = 'Footer must be at most 60 characters.';
        }
        if (values.whatsappButtonLabel && values.whatsappButtonLabel.length > 20) {
          errors.whatsappButtonLabel = 'Button label must be at most 20 characters.';
        }
        if (values.whatsappButtonLabel && !values.whatsappButtonUrl) {
          errors.whatsappButtonUrl = 'Button URL is required when a label is set.';
        }
        if (values.whatsappButtonUrl && !values.whatsappButtonLabel) {
          errors.whatsappButtonLabel = 'Button label is required when a URL is set.';
        }
      }

      return errors;
    },
    onSubmit: async (values) => {
      await submitTemplate(buildTemplatePayload(values), true);
    },
  });
  const variableCatalog = useMemo(
    () =>
      buildTemplateVariableCatalog({
        templateType: formik.values.templateType,
        documentSubtype:
          formik.values.templateType === 'ACCOUNTING_DOCUMENTS' && formik.values.documentSubtype
            ? formik.values.documentSubtype
            : undefined,
        indexedCustomFields,
      }),
    [formik.values.documentSubtype, formik.values.templateType, indexedCustomFields],
  );

  const previewBody = useMemo(
    () => removeMarkdownEditorsInternalVariables(formik.values.body).trim(),
    [formik.values.body],
  );

  const buildTemplatePayload = (values: TemplateFormValues): TemplateWritePayload => {
    const normalizedBody = removeMarkdownEditorsInternalVariables(values.body);

    if (values.channel === 'WHATSAPP') {
      const hasButton = Boolean(values.whatsappButtonLabel?.trim() && values.whatsappButtonUrl?.trim());

      return {
        channel: values.channel,
        name: values.name,
        body: normalizedBody,
        templateType: values.templateType,
        documentSubtype:
          values.templateType === 'ACCOUNTING_DOCUMENTS'
            ? values.documentSubtype || undefined
            : undefined,
        isArchived: values.isArchived,
        whatsapp: {
          category: values.whatsappCategory,
          language: values.whatsappLanguage,
          header: values.whatsappHeader || undefined,
          footer: values.whatsappFooter || undefined,
          button: hasButton
            ? { label: values.whatsappButtonLabel.trim(), url: values.whatsappButtonUrl.trim() }
            : undefined,
        },
      };
    }

    return {
      channel: values.channel,
      name: values.name,
      subject: values.subject,
      body: composeTemplateBodyWithSignature(normalizedBody, values.signature),
      templateType: values.templateType,
      documentSubtype:
        values.templateType === 'ACCOUNTING_DOCUMENTS'
          ? values.documentSubtype || undefined
          : undefined,
      isArchived: values.isArchived,
    };
  };

  useEffect(() => {
    setActiveVariableTarget(formik.values.channel === 'WHATSAPP' ? 'body' : 'subject');
  }, [formik.values.channel]);

  useEffect(() => {
    if (!pendingSubjectSelectionRef.current || !subjectInputRef.current) {
      return;
    }

    const { start, end } = pendingSubjectSelectionRef.current;

    pendingSubjectSelectionRef.current = null;
    subjectInputRef.current.focus();
    subjectInputRef.current.setSelectionRange(start, end);
    subjectSelectionRef.current = { start, end };
  }, [formik.values.subject]);

  useEffect(() => {
    if (!pendingSignatureSelectionRef.current || !signatureInputRef.current) {
      return;
    }

    const { start, end } = pendingSignatureSelectionRef.current;

    pendingSignatureSelectionRef.current = null;
    signatureInputRef.current.focus();
    signatureInputRef.current.setSelectionRange(start, end);
    signatureSelectionRef.current = { start, end };
  }, [formik.values.signature]);

  const isPublishDisabled =
    isSubmitting || (!formik.dirty && !(loadedTemplate?.isModifiedPostPublish || false));

  const updateSelection = (
    element: HTMLInputElement | HTMLTextAreaElement,
    selectionRef: React.MutableRefObject<{ start: number | null; end: number | null }>,
  ) => {
    selectionRef.current = {
      start: element.selectionStart,
      end: element.selectionEnd,
    };
  };

  const createVariableInsertionRequest = (text: string): TemplateVariableInsertionRequest => {
    variableInsertionRequestIdRef.current += 1;

    return {
      id: variableInsertionRequestIdRef.current,
      text,
    };
  };

  const insertSubjectVariable = (variableKey: string) => {
    const selectionStart =
      subjectInputRef.current?.selectionStart ?? subjectSelectionRef.current.start;
    const selectionEnd = subjectInputRef.current?.selectionEnd ?? subjectSelectionRef.current.end;
    const nextSelection = insertTemplateVariableAtSelection(
      formik.values.subject,
      variableKey,
      selectionStart,
      selectionEnd,
    );

    pendingSubjectSelectionRef.current = {
      start: nextSelection.nextSelectionStart,
      end: nextSelection.nextSelectionEnd,
    };

    void formik.setFieldValue('subject', nextSelection.nextValue);
  };

  const insertSignatureVariable = (variableKey: string) => {
    const selectionStart =
      signatureInputRef.current?.selectionStart ?? signatureSelectionRef.current.start;
    const selectionEnd =
      signatureInputRef.current?.selectionEnd ?? signatureSelectionRef.current.end;
    const nextSelection = insertTemplateVariableAtSelection(
      formik.values.signature,
      variableKey,
      selectionStart,
      selectionEnd,
    );

    pendingSignatureSelectionRef.current = {
      start: nextSelection.nextSelectionStart,
      end: nextSelection.nextSelectionEnd,
    };

    void formik.setFieldValue('signature', nextSelection.nextValue);
  };

  const handleVariableInsert = (option: TemplateVariableOption) => {
    if (option.insertBehavior === 'documentShareLinkCta') {
      if (formik.values.channel === 'WHATSAPP') {
        const ctaLabel = getDocumentShareLinkCtaLabel(
          formik.values.templateType === 'ACCOUNTING_DOCUMENTS'
            ? formik.values.documentSubtype || undefined
            : undefined,
        );

        void formik.setFieldValue('whatsappButtonLabel', ctaLabel);
        void formik.setFieldValue('whatsappButtonUrl', getTemplateVariableToken(option.value));
        return;
      }

      const ctaLabel = getDocumentShareLinkCtaLabel(
        formik.values.templateType === 'ACCOUNTING_DOCUMENTS'
          ? formik.values.documentSubtype || undefined
          : undefined,
      );

      setActiveVariableTarget('body');
      setPendingBodyVariableInsertion(
        createVariableInsertionRequest(
          buildTemplateCtaToken({
            label: ctaLabel,
            url: getTemplateVariableToken(option.value),
          }),
        ),
      );
      return;
    }

    const variableKey = option.value;

    switch (activeVariableTarget) {
      case 'body':
        setPendingBodyVariableInsertion(
          createVariableInsertionRequest(getTemplateVariableToken(variableKey)),
        );
        return;
      case 'signature':
        insertSignatureVariable(variableKey);
        return;
      case 'subject':
        insertSubjectVariable(variableKey);
        return;
      default:
        return;
    }
  };

  const handleDraftSave = async () => {
    setIsActionsMenuOpen(false);

    const errors = await formik.validateForm();

    if (Object.keys(errors).length) {
      formik.setTouched({
        channel: true,
        name: true,
        subject: formik.values.channel === 'EMAIL',
        body: true,
        signature: formik.values.channel === 'EMAIL',
        templateType: true,
        documentSubtype: formik.values.templateType === 'ACCOUNTING_DOCUMENTS',
      });
      return;
    }

    await submitTemplate(buildTemplatePayload(formik.values), false);
  };

  const handleAiGenerated = (result: {
    name: string;
    subject: string;
    body: string;
    signature?: string;
    channel: 'EMAIL' | 'WHATSAPP';
    templateType: (typeof ENABLED_EMAIL_TEMPLATE_TYPE_KEYS)[number];
    documentSubtype?: DocumentTemplateSubtypeKey;
    whatsappCategory?: WhatsappCategory;
    whatsappLanguage?: string;
    whatsappHeader?: string;
    whatsappFooter?: string;
    whatsappButton?: { label: string; url: string };
  }) => {
    void formik.setFieldValue('channel', result.channel);
    void formik.setFieldValue('name', result.name);
    void formik.setFieldValue('body', result.body);
    void formik.setFieldValue('templateType', result.templateType);
    void formik.setFieldValue('documentSubtype', result.documentSubtype || '');

    if (result.channel === 'EMAIL') {
      if (result.subject) {
        void formik.setFieldValue('subject', result.subject);
      }
      if (result.signature) {
        void formik.setFieldValue('signature', result.signature);
      }
    }

    if (result.channel === 'WHATSAPP') {
      void formik.setFieldValue('whatsappCategory', result.whatsappCategory || 'MARKETING');
      void formik.setFieldValue('whatsappLanguage', result.whatsappLanguage || 'en');
      void formik.setFieldValue('whatsappHeader', result.whatsappHeader || '');
      void formik.setFieldValue('whatsappFooter', result.whatsappFooter || '');
      void formik.setFieldValue('whatsappButtonLabel', result.whatsappButton?.label || '');
      void formik.setFieldValue('whatsappButtonUrl', result.whatsappButton?.url || '');
    }
  };

  const handlePublish = async () => {
    const errors = await formik.validateForm();

    if (Object.keys(errors).length) {
      formik.setTouched({
        channel: true,
        name: true,
        subject: formik.values.channel === 'EMAIL',
        body: true,
        signature: formik.values.channel === 'EMAIL',
        templateType: true,
        documentSubtype: formik.values.templateType === 'ACCOUNTING_DOCUMENTS',
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
            {mode === 'create' ? (
              <AiTemplatePrompt onGenerated={handleAiGenerated} />
            ) : null}

            <div className='field-group'>
              <label className='field-label'>
                Channel
                <span>*</span>
              </label>
              <p className='helper-text'>Pick the delivery channel for this template.</p>
              <div className='channel-radio-group'>
                <label
                  className={`channel-radio-option${formik.values.channel === 'EMAIL' ? ' channel-radio-option--selected' : ''}${mode === 'edit' ? ' channel-radio-option--disabled' : ''}`}
                >
                  <input
                    type='radio'
                    name='channel'
                    value='EMAIL'
                    checked={formik.values.channel === 'EMAIL'}
                    disabled={mode === 'edit'}
                    onChange={() => {
                      void formik.setFieldValue('channel', 'EMAIL');
                    }}
                    className='channel-radio-input'
                  />
                  <span className='channel-radio-label'>Email</span>
                </label>
                <label
                  className={`channel-radio-option${formik.values.channel === 'WHATSAPP' ? ' channel-radio-option--selected' : ''}${mode === 'edit' ? ' channel-radio-option--disabled' : ''}`}
                >
                  <input
                    type='radio'
                    name='channel'
                    value='WHATSAPP'
                    checked={formik.values.channel === 'WHATSAPP'}
                    disabled={mode === 'edit'}
                    onChange={() => {
                      void formik.setFieldValue('channel', 'WHATSAPP');
                    }}
                    className='channel-radio-input'
                  />
                  <span className='channel-radio-label'>WhatsApp</span>
                </label>
              </div>
              {formik.touched.channel && formik.errors.channel ? (
                <div className='field-error'>{formik.errors.channel}</div>
              ) : null}
            </div>

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
                onChange={(event) => {
                  const nextTemplateType = event.target.value as TemplateFormValues['templateType'];

                  void formik.setFieldValue('templateType', nextTemplateType);

                  if (nextTemplateType !== 'ACCOUNTING_DOCUMENTS') {
                    void formik.setFieldValue('documentSubtype', '');
                  }
                }}
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

            {formik.values.templateType === 'ACCOUNTING_DOCUMENTS' ? (
              <div className='field-group'>
                <label className='field-label' htmlFor='documentSubtype'>
                  Document subtype
                  <span>*</span>
                </label>
                <p className='helper-text'>Choose the accounting document type for this template.</p>
                <select
                  id='documentSubtype'
                  name='documentSubtype'
                  className='select-input'
                  value={formik.values.documentSubtype}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  aria-label='Document subtype'
                >
                  <option value=''>Select subtype</option>
                  {ACCOUNTING_DOCUMENT_SUBTYPE_KEYS.map((documentSubtype) => (
                    <option key={documentSubtype} value={documentSubtype}>
                      {ACCOUNTING_DOCUMENT_SUBTYPES[documentSubtype].label}
                    </option>
                  ))}
                </select>
                {formik.touched.documentSubtype && formik.errors.documentSubtype ? (
                  <div className='field-error'>{formik.errors.documentSubtype}</div>
                ) : null}
              </div>
            ) : null}

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

            <div className='template-form-variable-actions'>
              <TemplateVariableMenuButton
                buttonLabel='Add variable'
                buttonAriaLabel='Add variable'
                options={variableCatalog.options}
                disabled={!activeVariableTarget}
                onSelect={handleVariableInsert}
              />
            </div>

            {formik.values.channel === 'EMAIL' ? (
              <>
                <div className='field-group'>
                  <label className='field-label' htmlFor='subject'>
                    Email Subject
                    <span>*</span>
                  </label>
                  <input
                    id='subject'
                    name='subject'
                    className='text-input'
                    ref={subjectInputRef}
                    value={formik.values.subject}
                    onChange={(event) => {
                      setActiveVariableTarget('subject');
                      formik.handleChange(event);
                      updateSelection(event.currentTarget, subjectSelectionRef);
                    }}
                    onBlur={formik.handleBlur}
                    onClick={(event) => {
                      setActiveVariableTarget('subject');
                      updateSelection(event.currentTarget, subjectSelectionRef);
                    }}
                    onKeyUp={(event) => {
                      setActiveVariableTarget('subject');
                      updateSelection(event.currentTarget, subjectSelectionRef);
                    }}
                    onSelect={(event) => {
                      setActiveVariableTarget('subject');
                      updateSelection(event.currentTarget, subjectSelectionRef);
                    }}
                    onFocus={() => {
                      setActiveVariableTarget('subject');
                    }}
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
                  onActivate={() => {
                    setActiveVariableTarget('body');
                  }}
                  pendingVariableInsertion={pendingBodyVariableInsertion}
                  error={formik.touched.body ? formik.errors.body : undefined}
                />

                <div className='field-group'>
                  <label className='field-label' htmlFor='signature'>
                    Email Signature
                  </label>
                  <p className='helper-text'>
                    Auto-appended below the email body as a sign-off.
                  </p>
                  <textarea
                    id='signature'
                    name='signature'
                    className='textarea-input'
                    rows={4}
                    ref={signatureInputRef}
                    value={formik.values.signature}
                    onChange={(event) => {
                      setActiveVariableTarget('signature');
                      formik.handleChange(event);
                      updateSelection(event.currentTarget, signatureSelectionRef);
                    }}
                    onBlur={formik.handleBlur}
                    onClick={(event) => {
                      setActiveVariableTarget('signature');
                      updateSelection(event.currentTarget, signatureSelectionRef);
                    }}
                    onKeyUp={(event) => {
                      setActiveVariableTarget('signature');
                      updateSelection(event.currentTarget, signatureSelectionRef);
                    }}
                    onSelect={(event) => {
                      setActiveVariableTarget('signature');
                      updateSelection(event.currentTarget, signatureSelectionRef);
                    }}
                    onFocus={() => {
                      setActiveVariableTarget('signature');
                    }}
                    aria-label='Email Signature'
                  />
                </div>
              </>
            ) : (
              <>
                <div className='whatsapp-fields-row'>
                  <div className='field-group'>
                    <label className='field-label' htmlFor='whatsappCategory'>
                      WhatsApp Category
                      <span>*</span>
                    </label>
                    <p className='helper-text'>Meta template category for approval routing.</p>
                    <select
                      id='whatsappCategory'
                      name='whatsappCategory'
                      className='select-input'
                      value={formik.values.whatsappCategory}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      aria-label='WhatsApp Category'
                    >
                      <option value='MARKETING'>Marketing</option>
                      <option value='UTILITY'>Utility</option>
                    </select>
                  </div>
                  <div className='field-group'>
                    <label className='field-label' htmlFor='whatsappLanguage'>
                      Language
                      <span>*</span>
                    </label>
                    <p className='helper-text'>Template language for Meta submission.</p>
                    <select
                      id='whatsappLanguage'
                      name='whatsappLanguage'
                      className='select-input'
                      value={formik.values.whatsappLanguage}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      aria-label='Language'
                    >
                      {WHATSAPP_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className='field-group'>
                  <label className='field-label' htmlFor='whatsappHeader'>
                    Header
                  </label>
                  <p className='helper-text'>Optional header text, max 60 characters. Supports one variable.</p>
                  <input
                    id='whatsappHeader'
                    name='whatsappHeader'
                    className='text-input'
                    maxLength={60}
                    placeholder='e.g. Invoice {{document.number}}'
                    value={formik.values.whatsappHeader}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    aria-label='WhatsApp Header'
                  />
                  {formik.values.whatsappHeader ? (
                    <span className='field-char-count'>{formik.values.whatsappHeader.length} / 60</span>
                  ) : null}
                  {formik.touched.whatsappHeader && formik.errors.whatsappHeader ? (
                    <div className='field-error'>{formik.errors.whatsappHeader}</div>
                  ) : null}
                </div>

                <TemplatePlainTextEditor
                  id='body'
                  label='WhatsApp Message'
                  value={formik.values.body}
                  maxLength={1024}
                  helperText='Compose a plain-text WhatsApp template with variables.'
                  onChange={(nextValue) => {
                    void formik.setFieldValue('body', nextValue);
                  }}
                  onActivate={() => {
                    setActiveVariableTarget('body');
                  }}
                  pendingVariableInsertion={pendingBodyVariableInsertion}
                  error={formik.touched.body ? formik.errors.body : undefined}
                />

                <div className='field-group'>
                  <label className='field-label' htmlFor='whatsappFooter'>
                    Footer
                  </label>
                  <p className='helper-text'>Optional footer text, max 60 characters. No variables allowed.</p>
                  <input
                    id='whatsappFooter'
                    name='whatsappFooter'
                    className='text-input'
                    maxLength={60}
                    placeholder='e.g. Sent via Refrens'
                    value={formik.values.whatsappFooter}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    aria-label='WhatsApp Footer'
                  />
                  {formik.values.whatsappFooter ? (
                    <span className='field-char-count'>{formik.values.whatsappFooter.length} / 60</span>
                  ) : null}
                  {formik.touched.whatsappFooter && formik.errors.whatsappFooter ? (
                    <div className='field-error'>{formik.errors.whatsappFooter}</div>
                  ) : null}
                </div>

                <fieldset className='whatsapp-button-fieldset'>
                  <legend className='field-label'>Button (Optional)</legend>
                  <p className='helper-text'>Add a tappable CTA button. Use the Add variable menu to insert a document share link.</p>
                  <div className='whatsapp-button-fields'>
                    <div className='field-group'>
                      <label className='field-label field-label--small' htmlFor='whatsappButtonLabel'>
                        Label
                      </label>
                      <input
                        id='whatsappButtonLabel'
                        name='whatsappButtonLabel'
                        className='text-input'
                        maxLength={20}
                        placeholder='e.g. View Invoice'
                        value={formik.values.whatsappButtonLabel}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        aria-label='Button Label'
                      />
                      {formik.values.whatsappButtonLabel ? (
                        <span className='field-char-count'>{formik.values.whatsappButtonLabel.length} / 20</span>
                      ) : null}
                      {formik.touched.whatsappButtonLabel && formik.errors.whatsappButtonLabel ? (
                        <div className='field-error'>{formik.errors.whatsappButtonLabel}</div>
                      ) : null}
                    </div>
                    <div className='field-group'>
                      <label className='field-label field-label--small' htmlFor='whatsappButtonUrl'>
                        URL
                      </label>
                      <input
                        id='whatsappButtonUrl'
                        name='whatsappButtonUrl'
                        className='text-input'
                        placeholder='e.g. {{document.share_link}}'
                        value={formik.values.whatsappButtonUrl}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        aria-label='Button URL'
                      />
                      {formik.touched.whatsappButtonUrl && formik.errors.whatsappButtonUrl ? (
                        <div className='field-error'>{formik.errors.whatsappButtonUrl}</div>
                      ) : null}
                    </div>
                  </div>
                </fieldset>
              </>
            )}

            {submitError ? <div className='template-inline-error'>{submitError}</div> : null}
          </form>
        </section>

        <aside className='template-preview-panel'>
          {formik.values.channel === 'WHATSAPP' ? (
            <TemplateWhatsappPreview
              templateType={formik.values.templateType}
              body={previewBody}
              variableOptions={variableCatalog.options}
              header={formik.values.whatsappHeader}
              footer={formik.values.whatsappFooter}
              buttonLabel={formik.values.whatsappButtonLabel}
              buttonUrl={formik.values.whatsappButtonUrl}
            />
          ) : (
            <TemplateEmailPreview
              templateType={formik.values.templateType}
              subject={formik.values.subject}
              body={previewBody}
              signature={formik.values.signature}
              variableOptions={variableCatalog.options}
            />
          )}
        </aside>
      </div>
    </main>
  );
}
