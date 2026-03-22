import type { EmailTemplateTypeKey } from '@/data/email/templateTypes';
import type { DocumentTemplateSubtypeKey } from '../data/email/documentSubtypes';

export type SerializedActor = {
  _id: string;
  name: string;
  email?: string;
};

export type SerializedBusiness = {
  _id: string;
  urlKey: string;
  name: string;
};

export type SerializedMessageTemplate = {
  _id: string;
  name: string;
  subject: string;
  body: string;
  published?: {
    name?: string;
    subject?: string;
    body?: string;
  };
  status: 'DRAFT' | 'LIVE';
  channel: 'EMAIL' | 'WHATSAPP';
  isModifiedPostPublish: boolean;
  lastPublished?: string;
  templateType: EmailTemplateTypeKey;
  documentSubtype?: DocumentTemplateSubtypeKey;
  business: SerializedBusiness;
  createdBy?: SerializedActor;
  isDefault: boolean;
  isArchived: boolean;
  archived?: {
    by?: string;
  };
  isRemoved: boolean;
  removed?: {
    by?: string;
    reason?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type TemplateWritePayload = {
  name?: string;
  subject?: string;
  body?: string;
  templateType?: EmailTemplateTypeKey;
  documentSubtype?: DocumentTemplateSubtypeKey;
  isArchived?: boolean;
  isRemoved?: boolean;
};

export type TemplateListResponse = {
  data: SerializedMessageTemplate[];
  total: number;
  limit: number;
  skip: number;
};
