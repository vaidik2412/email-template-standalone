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
import { TemplateNotFoundError } from './errors';
import { getTemplateScopeQuery, getVisibleTemplateQuery } from './queries';
import { validateTemplateVariableUsage } from '../templateVariables/service';

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

  return serializeTemplate(document.toObject());
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

  const rawSanitizedPayload = sanitizeTemplateWritePayload(payload) as TemplateWritePayload & {
    documentSubtype?: DocumentTemplateSubtypeKey;
  };
  const { channel: _ignoredChannel, ...sanitizedPayload } = rawSanitizedPayload;
  const preservedChannel = existingTemplate.channel as SerializedMessageTemplate['channel'];
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

  return serializeTemplate(template);
}
