import type { InferSchemaType, Types } from 'mongoose';

import type { messageTemplateSchema } from '../models/messageTemplate';

export type MessageTemplateStatus = 'DRAFT' | 'LIVE';
export type MessageTemplateChannel = 'EMAIL' | 'WHATSAPP';

export type MessageTemplateRecord = InferSchemaType<typeof messageTemplateSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
