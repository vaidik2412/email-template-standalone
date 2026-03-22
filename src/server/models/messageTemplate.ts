import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

import { EMAIL_TEMPLATE_TYPES } from '@/data/email/templateTypes';
import { ACCOUNTING_DOCUMENT_SUBTYPE_KEYS } from '../../data/email/documentSubtypes';

export const MESSAGE_TEMPLATES_MODEL_NAME = 'MessageTemplate';
export const MESSAGE_TEMPLATES_COLLECTION_NAME = 'messageTemplates';

const DEFAULT_NAME_MAX_LENGTH = 500;
const RELAXED_STRING_MAX_LENGTH = 10_000;
const DEFAULT_TEMPLATES_MAX_LENGTH = 100_000;

const publishedSchema = new Schema(
  {
    name: {
      type: String,
      maxLength: DEFAULT_NAME_MAX_LENGTH,
    },
    subject: {
      type: String,
      maxLength: RELAXED_STRING_MAX_LENGTH,
    },
    body: {
      type: String,
      maxLength: DEFAULT_TEMPLATES_MAX_LENGTH,
    },
  },
  {
    _id: false,
  },
);

const archivedSchema = new Schema(
  {
    by: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      index: true,
    },
  },
  {
    _id: false,
  },
);

const removedSchema = new Schema(
  {
    by: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      index: true,
    },
    reason: String,
  },
  {
    _id: false,
  },
);

const whatsappSchema = new Schema(
  {
    template: {
      name: String,
      id: String,
    },
    variables: [String],
    campaign: {
      name: String,
      id: String,
    },
    integrationId: {
      type: Schema.Types.ObjectId,
      ref: 'integrations',
      index: true,
    },
    number: {
      type: String,
      trim: true,
      maxLength: 20,
    },
    media: {
      urlPath: String,
      filenamePath: String,
    },
    status: {
      type: String,
      default: 'PENDING',
    },
  },
  {
    _id: false,
  },
);

export const messageTemplateSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxLength: DEFAULT_NAME_MAX_LENGTH,
    },
    subject: {
      type: String,
      trim: true,
      required() {
        return this.channel !== 'WHATSAPP';
      },
      maxLength: RELAXED_STRING_MAX_LENGTH,
    },
    body: {
      type: String,
      trim: true,
      required() {
        return this.channel !== 'WHATSAPP';
      },
      maxLength: DEFAULT_TEMPLATES_MAX_LENGTH,
    },
    published: publishedSchema,
    status: {
      type: String,
      enum: ['DRAFT', 'LIVE'],
      default: 'DRAFT',
    },
    channel: {
      type: String,
      enum: ['EMAIL', 'WHATSAPP'],
      default: 'EMAIL',
    },
    isModifiedPostPublish: {
      type: Boolean,
      default: false,
    },
    lastPublished: Schema.Types.Date,
    templateType: {
      type: String,
      enum: Object.keys(EMAIL_TEMPLATE_TYPES),
      required() {
        return this.channel !== 'WHATSAPP';
      },
      index: true,
    },
    documentSubtype: {
      type: String,
      enum: ACCOUNTING_DOCUMENT_SUBTYPE_KEYS,
      required() {
        return this.channel !== 'WHATSAPP' && this.templateType === 'ACCOUNTING_DOCUMENTS';
      },
    },
    business: {
      type: Schema.Types.ObjectId,
      ref: 'businesses',
      index: true,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archived: archivedSchema,
    isRemoved: {
      type: Boolean,
      default: false,
    },
    removed: removedSchema,
    whatsapp: whatsappSchema,
    params: Schema.Types.Mixed,
    _systemMeta: Schema.Types.Mixed,
  },
  {
    timestamps: true,
    strict: 'throw',
  },
);

export type MessageTemplateDocument = InferSchemaType<typeof messageTemplateSchema>;

export function getMessageTemplateModel(
  connection: typeof mongoose = mongoose,
): Model<MessageTemplateDocument> {
  return (
    (connection.models[MESSAGE_TEMPLATES_MODEL_NAME] as Model<MessageTemplateDocument> | undefined) ||
    connection.model<MessageTemplateDocument>(
      MESSAGE_TEMPLATES_MODEL_NAME,
      messageTemplateSchema,
      MESSAGE_TEMPLATES_COLLECTION_NAME,
    )
  );
}
