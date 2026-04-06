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
  whatsapp?: {
    template?: { id?: string; name?: string };
    variables?: string[];
    category?: 'MARKETING' | 'UTILITY';
    language?: string;
    header?: string;
    footer?: string;
    button?: { label?: string; url?: string };
    campaign?: { id?: string; name?: string };
    integrationId?: string;
    number?: string;
    media?: { urlPath?: string; filenamePath?: string };
    status?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type TemplateWritePayload = {
  channel?: 'EMAIL' | 'WHATSAPP';
  name?: string;
  subject?: string;
  body?: string;
  templateType?: EmailTemplateTypeKey;
  documentSubtype?: DocumentTemplateSubtypeKey;
  isArchived?: boolean;
  isRemoved?: boolean;
  whatsapp?: {
    category?: 'MARKETING' | 'UTILITY';
    language?: string;
    header?: string;
    footer?: string;
    button?: {
      label: string;
      url: string;
    };
  };
};

export type TemplateListResponse = {
  data: SerializedMessageTemplate[];
  total: number;
  limit: number;
  skip: number;
};
