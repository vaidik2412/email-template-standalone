import { Types } from 'mongoose';

import type { DocumentTemplateSubtypeKey } from '@/data/email/documentSubtypes';
import { DEFAULT_EMAIL_TEMPLATES } from '@/data/email/defaultTemplates';
import { DEFAULT_WHATSAPP_TEMPLATES } from '@/data/whatsapp/defaultTemplates';
import type {
  SerializedMessageTemplate,
  TemplateListResponse,
  TemplateWritePayload,
} from '@/types/messageTemplate';

import { connectToDatabase } from '../db';
import { FIXED_APP_CONTEXT } from '../constants/fixedContext';
import { getMessageTemplateModel } from '../models/messageTemplate';
import { applyTemplateMutation } from './mutations';
import { TemplateLockedError, TemplateNotFoundError, TemplatePayloadValidationError } from './errors';
import { getTemplateScopeQuery, getVisibleTemplateQuery } from './queries';
import { validateTemplateVariableUsage } from '../templateVariables/service';
import {
  fetchTemplateStatusFromAisensy,
  submitTemplateToAisensy,
} from '../aisensy/publishTemplate';
import { validateWhatsappTemplateForSubmission } from '../whatsapp/submission';

const DEFAULT_LIMIT = 10;

function sanitizeTemplateWritePayload(payload: TemplateWritePayload) {
  const sanitized: Record<string, unknown> = {};

  if (payload.channel === 'EMAIL' || payload.channel === 'WHATSAPP') {
    sanitized.channel = payload.channel;
  }

  if (typeof payload.name === 'string') {
    sanitized.name = payload.name;
  }

  if (typeof payload.subject === 'string') {
    sanitized.subject = payload.subject;
  }

  if (typeof payload.body === 'string') {
    sanitized.body = payload.body;
  }

  if (typeof payload.templateType === 'string') {
    sanitized.templateType = payload.templateType;
  }

  if (typeof payload.documentSubtype === 'string') {
    sanitized.documentSubtype = payload.documentSubtype;
  }

  if (typeof payload.isArchived === 'boolean') {
    sanitized.isArchived = payload.isArchived;
  }

  if (typeof payload.isRemoved === 'boolean') {
    sanitized.isRemoved = payload.isRemoved;
  }

  if (payload.whatsapp && typeof payload.whatsapp === 'object') {
    sanitized.whatsapp = payload.whatsapp;
  }

  return sanitized;
}

function serializeTemplate(template: any): SerializedMessageTemplate {
  return {
    _id: template._id.toString(),
    name: template.name,
    subject: template.subject || '',
    body: template.body,
    published: template.published
      ? {
          name: template.published.name,
          subject: template.published.subject,
          body: template.published.body,
        }
      : undefined,
    status: template.status,
    channel: template.channel,
    isModifiedPostPublish: Boolean(template.isModifiedPostPublish),
    lastPublished: template.lastPublished ? new Date(template.lastPublished).toISOString() : undefined,
    templateType: template.templateType,
    documentSubtype: template.documentSubtype,
    business: {
      _id: FIXED_APP_CONTEXT.business.id,
      urlKey: FIXED_APP_CONTEXT.business.urlKey,
      name: FIXED_APP_CONTEXT.business.name,
    },
    createdBy: template.createdBy
      ? {
          _id: FIXED_APP_CONTEXT.user.id,
          name: FIXED_APP_CONTEXT.user.name,
          email: FIXED_APP_CONTEXT.user.email,
        }
      : undefined,
    isDefault: Boolean(template.isDefault),
    isArchived: Boolean(template.isArchived),
    archived: template.archived?.by
      ? {
          by: template.archived.by.toString(),
        }
      : undefined,
    isRemoved: Boolean(template.isRemoved),
    removed: template.removed?.by
      ? {
          by: template.removed.by.toString(),
          reason: template.removed.reason,
        }
      : undefined,
    whatsapp: template.whatsapp
      ? {
          template: template.whatsapp.template,
          variables: template.whatsapp.variables,
          category: template.whatsapp.category,
          language: template.whatsapp.language,
          header: template.whatsapp.header,
          footer: template.whatsapp.footer,
          button: template.whatsapp.button,
          campaign: template.whatsapp.campaign,
          integrationId: template.whatsapp.integrationId?.toString(),
          number: template.whatsapp.number,
          media: template.whatsapp.media,
          status: template.whatsapp.status,
        }
      : undefined,
    createdAt: new Date(template.createdAt).toISOString(),
    updatedAt: new Date(template.updatedAt).toISOString(),
  };
}

async function ensureDefaultTemplates() {
  const MessageTemplate = getMessageTemplateModel();
  const visibleEmailCount = await MessageTemplate.countDocuments({
    ...getVisibleTemplateQuery(),
    channel: 'EMAIL',
  });

  if (visibleEmailCount > 0) {
    return;
  }

  const existingDefaultTemplate = await MessageTemplate.findOne({
    ...getTemplateScopeQuery(),
    channel: 'EMAIL',
    isDefault: true,
  }).lean();

  if (existingDefaultTemplate?._id) {
    return;
  }

  const businessId = new Types.ObjectId(FIXED_APP_CONTEXT.business.id);
  const actorId = FIXED_APP_CONTEXT.user.id;
  const userId = new Types.ObjectId(actorId);

  const payload = DEFAULT_EMAIL_TEMPLATES.map((template) =>
    applyTemplateMutation(
      {
        ...template,
        channel: 'EMAIL',
        business: businessId,
        createdBy: userId,
      },
      {
        actorId,
        isPublished: true,
      },
    ),
  );

  await MessageTemplate.insertMany(payload);
}

async function ensureDefaultWhatsappTemplates() {
  const MessageTemplate = getMessageTemplateModel();
  const visibleWhatsappCount = await MessageTemplate.countDocuments({
    ...getVisibleTemplateQuery(),
    channel: 'WHATSAPP',
  });

  if (visibleWhatsappCount > 0) {
    return;
  }

  const existingDefaultTemplate = await MessageTemplate.findOne({
    ...getTemplateScopeQuery(),
    channel: 'WHATSAPP',
    isDefault: true,
  }).lean();

  if (existingDefaultTemplate?._id) {
    return;
  }

  const businessId = new Types.ObjectId(FIXED_APP_CONTEXT.business.id);
  const actorId = FIXED_APP_CONTEXT.user.id;
  const userId = new Types.ObjectId(actorId);

  const payload = DEFAULT_WHATSAPP_TEMPLATES.map((template) =>
    applyTemplateMutation(
      {
        ...template,
        channel: 'WHATSAPP' as const,
        business: businessId,
        createdBy: userId,
      },
      {
        actorId,
        isPublished: true,
      },
    ),
  );

  await MessageTemplate.insertMany(payload);
}

export async function listTemplates(): Promise<TemplateListResponse> {
  await connectToDatabase();
  await ensureDefaultTemplates();
  await ensureDefaultWhatsappTemplates();

  const MessageTemplate = getMessageTemplateModel();
  const templates = await MessageTemplate.find(getVisibleTemplateQuery()).sort({ updatedAt: -1 }).lean();

  return {
    data: templates.map(serializeTemplate),
    total: templates.length,
    limit: DEFAULT_LIMIT,
    skip: 0,
  };
}

export async function getTemplateById(templateId: string) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(templateId)) {
    throw new TemplateNotFoundError(templateId);
  }

  const MessageTemplate = getMessageTemplateModel();
  const template = await MessageTemplate.findOne({
    ...getTemplateScopeQuery(),
    _id: new Types.ObjectId(templateId),
  }).lean();

  if (!template?._id) {
    throw new TemplateNotFoundError(templateId);
  }

  return serializeTemplate(template);
}

export async function createTemplate(
  payload: TemplateWritePayload,
  options: { isPublished?: boolean } = {},
) {
  await connectToDatabase();

  const actorId = FIXED_APP_CONTEXT.user.id;
  const businessId = new Types.ObjectId(FIXED_APP_CONTEXT.business.id);
  const userId = new Types.ObjectId(actorId);
  const MessageTemplate = getMessageTemplateModel();
  const sanitizedPayload = sanitizeTemplateWritePayload(payload) as TemplateWritePayload & {
    documentSubtype?: DocumentTemplateSubtypeKey;
    channel?: SerializedMessageTemplate['channel'];
  };
  const channel = sanitizedPayload.channel === 'WHATSAPP' ? 'WHATSAPP' : 'EMAIL';
  const normalizedPayload =
    sanitizedPayload.templateType === 'ACCOUNTING_DOCUMENTS'
      ? sanitizedPayload
      : {
          ...sanitizedPayload,
          documentSubtype: undefined,
        };

  await validateTemplateVariableUsage({
    channel,
    templateType: normalizedPayload.templateType as SerializedMessageTemplate['templateType'],
    documentSubtype: normalizedPayload.documentSubtype,
    subject: channel === 'EMAIL' ? normalizedPayload.subject : undefined,
    body: normalizedPayload.body,
  });

  if (options.isPublished && channel === 'WHATSAPP') {
    assertWhatsappPublishable({
      name: normalizedPayload.name,
      body: normalizedPayload.body,
      templateType: normalizedPayload.templateType as SerializedMessageTemplate['templateType'],
      documentSubtype: normalizedPayload.documentSubtype,
      whatsapp: normalizedPayload.whatsapp,
    });
  }

  const document = await MessageTemplate.create(
    applyTemplateMutation(
      {
        ...normalizedPayload,
        subject: channel === 'EMAIL' ? normalizedPayload.subject : undefined,
        channel,
        business: businessId,
        createdBy: userId,
      },
      {
        actorId,
        isPublished: options.isPublished,
      },
    ),
  );

  let serialized = serializeTemplate(document.toObject());

  if (options.isPublished && channel === 'WHATSAPP') {
    serialized = await submitWhatsappTemplate(serialized);
  }

  return serialized;
}

export async function updateTemplate(
  templateId: string,
  payload: TemplateWritePayload,
  options: { isPublished?: boolean } = {},
) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(templateId)) {
    throw new TemplateNotFoundError(templateId);
  }

  const actorId = FIXED_APP_CONTEXT.user.id;
  const MessageTemplate = getMessageTemplateModel();
  const existingTemplate = await MessageTemplate.findOne({
    ...getTemplateScopeQuery(),
    _id: new Types.ObjectId(templateId),
  }).lean();

  if (!existingTemplate?._id) {
    throw new TemplateNotFoundError(templateId);
  }

  const existingChannel = existingTemplate.channel as SerializedMessageTemplate['channel'];
  const existingWaStatus = existingTemplate.whatsapp?.status;
  const isWhatsappApprovedLock =
    existingChannel === 'WHATSAPP' &&
    typeof existingWaStatus === 'string' &&
    existingWaStatus.toUpperCase() === 'APPROVED';

  const isArchiveOnlyMutation = (() => {
    const keys = Object.keys(payload).filter(
      (key) => payload[key as keyof TemplateWritePayload] !== undefined,
    );
    return (
      keys.every((key) => key === 'isArchived' || key === 'isRemoved') && keys.length > 0
    );
  })();

  if (isWhatsappApprovedLock && !isArchiveOnlyMutation) {
    throw new TemplateLockedError(
      'This WhatsApp template is approved on WhatsApp and can no longer be edited.',
    );
  }

  const rawSanitizedPayload = sanitizeTemplateWritePayload(payload) as TemplateWritePayload & {
    documentSubtype?: DocumentTemplateSubtypeKey;
  };
  const { channel: _ignoredChannel, ...sanitizedPayload } = rawSanitizedPayload;
  const preservedChannel = existingChannel;
  const mergedPayload = {
    channel: preservedChannel,
    templateType: existingTemplate.templateType,
    documentSubtype: existingTemplate.documentSubtype,
    subject: existingTemplate.subject,
    body: existingTemplate.body,
    ...sanitizedPayload,
  } as TemplateWritePayload & {
    documentSubtype?: DocumentTemplateSubtypeKey;
  };
  const normalizedPayload =
    mergedPayload.templateType === 'ACCOUNTING_DOCUMENTS'
      ? mergedPayload
      : {
          ...mergedPayload,
          documentSubtype: undefined,
        };

  await validateTemplateVariableUsage({
    channel: preservedChannel,
    templateType: normalizedPayload.templateType as SerializedMessageTemplate['templateType'],
    documentSubtype: normalizedPayload.documentSubtype,
    subject: preservedChannel === 'EMAIL' ? normalizedPayload.subject : undefined,
    body: normalizedPayload.body,
  });

  if (options.isPublished && preservedChannel === 'WHATSAPP') {
    assertWhatsappPublishable({
      name: normalizedPayload.name ?? existingTemplate.name,
      body: normalizedPayload.body,
      templateType: normalizedPayload.templateType as SerializedMessageTemplate['templateType'],
      documentSubtype: normalizedPayload.documentSubtype,
      whatsapp: normalizedPayload.whatsapp,
    });
  }

  const template = await MessageTemplate.findOneAndUpdate(
    {
      ...getTemplateScopeQuery(),
      _id: new Types.ObjectId(templateId),
    },
    {
      $set: applyTemplateMutation(sanitizedPayload, {
        actorId,
        isPublished: options.isPublished,
      }),
      ...(normalizedPayload.templateType === 'ACCOUNTING_DOCUMENTS'
        ? {}
        : {
            $unset: {
              documentSubtype: 1,
            },
          }),
    },
    {
      new: true,
      runValidators: true,
    },
  ).lean();

  if (!template?._id) {
    throw new TemplateNotFoundError(templateId);
  }

  let serialized = serializeTemplate(template);

  if (options.isPublished && preservedChannel === 'WHATSAPP') {
    serialized = await submitWhatsappTemplate(serialized);
  }

  return serialized;
}

/**
 * Submit a freshly-published WhatsApp template to AiSensy and persist the
 * returned template name + status. AiSensy errors don't roll back the local
 * publish — we record the failure on the template so the UI can show it, then
 * rethrow so the caller can return a 502.
 */
async function submitWhatsappTemplate(
  template: SerializedMessageTemplate,
): Promise<SerializedMessageTemplate> {
  let outcome;
  try {
    outcome = await submitTemplateToAisensy(template);
  } catch (error) {
    await persistWhatsappStatus(template._id, {
      status: 'FAILED',
    });
    throw error;
  }

  if (outcome.skipped) {
    return template;
  }

  return persistWhatsappStatus(template._id, {
    status: outcome.status,
    templateName: outcome.templateName,
    templateId: outcome.templateId,
  });
}

async function persistWhatsappStatus(
  templateId: string,
  patch: {
    status: string;
    templateName?: string;
    templateId?: string;
  },
): Promise<SerializedMessageTemplate> {
  const MessageTemplate = getMessageTemplateModel();

  const setFields: Record<string, unknown> = {
    'whatsapp.status': patch.status,
  };
  if (patch.templateName) setFields['whatsapp.template.name'] = patch.templateName;
  if (patch.templateId) setFields['whatsapp.template.id'] = patch.templateId;

  const updated = await MessageTemplate.findOneAndUpdate(
    {
      ...getTemplateScopeQuery(),
      _id: new Types.ObjectId(templateId),
    },
    { $set: setFields },
    { new: true },
  ).lean();

  if (!updated?._id) {
    throw new TemplateNotFoundError(templateId);
  }

  return serializeTemplate(updated);
}

export async function refreshTemplateStatus(templateId: string) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(templateId)) {
    throw new TemplateNotFoundError(templateId);
  }

  const MessageTemplate = getMessageTemplateModel();
  const existing = await MessageTemplate.findOne({
    ...getTemplateScopeQuery(),
    _id: new Types.ObjectId(templateId),
  }).lean();

  if (!existing?._id) {
    throw new TemplateNotFoundError(templateId);
  }

  const waTemplateId = existing.whatsapp?.template?.id;
  const record = await fetchTemplateStatusFromAisensy(waTemplateId);

  if (!record) {
    return serializeTemplate(existing);
  }

  return persistWhatsappStatus(existing._id.toString(), {
    status: record.status,
    templateName: record.name,
    templateId: record.id,
  });
}

/**
 * Run the publish-time WhatsApp validator and convert any errors into the
 * existing `TemplatePayloadValidationError` (HTTP 400) so the form surfaces
 * them inline. Drafts skip this — only the publish path enforces the hard
 * provider constraints.
 */
function assertWhatsappPublishable(input: {
  name?: string;
  body?: string;
  templateType?: SerializedMessageTemplate['templateType'];
  documentSubtype?: DocumentTemplateSubtypeKey;
  whatsapp?: TemplateWritePayload['whatsapp'];
}) {
  const errors = validateWhatsappTemplateForSubmission(input);
  if (errors.length) {
    throw new TemplatePayloadValidationError(errors.join(' '));
  }
}
