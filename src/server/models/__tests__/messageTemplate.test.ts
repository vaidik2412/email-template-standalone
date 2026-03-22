import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';

import { FIXED_APP_CONTEXT } from '../../constants/fixedContext';
import { getMessageTemplateModel } from '../messageTemplate';

describe('messageTemplate model', () => {
  it('pins the model to the prod-like messageTemplates collection name', () => {
    const isolatedConnection = mongoose.createConnection();
    const MessageTemplate = getMessageTemplateModel(isolatedConnection);

    expect(MessageTemplate.collection.name).toBe('messageTemplates');

    isolatedConnection.deleteModel(/.+/);
  });

  it('requires name, subject, body, and templateType', () => {
    const MessageTemplate = getMessageTemplateModel();
    const template = new MessageTemplate({
      business: new mongoose.Types.ObjectId(FIXED_APP_CONTEXT.business.id),
      createdBy: new mongoose.Types.ObjectId(FIXED_APP_CONTEXT.user.id),
    });

    const error = template.validateSync();

    expect(error?.errors.name?.message).toMatch(/required/i);
    expect(error?.errors.subject?.message).toMatch(/required/i);
    expect(error?.errors.body?.message).toMatch(/required/i);
    expect(error?.errors.templateType?.message).toMatch(/required/i);
  });

  it('defaults to the prod-like email draft state', () => {
    const MessageTemplate = getMessageTemplateModel();
    const template = new MessageTemplate({
      name: 'Lead Follow-up',
      subject: 'Checking in',
      body: 'Hello {{contact.name}}',
      templateType: 'SALES_CRM',
      business: new mongoose.Types.ObjectId(FIXED_APP_CONTEXT.business.id),
      createdBy: new mongoose.Types.ObjectId(FIXED_APP_CONTEXT.user.id),
    });

    expect(template.channel).toBe('EMAIL');
    expect(template.status).toBe('DRAFT');
    expect(template.isArchived).toBe(false);
    expect(template.isRemoved).toBe(false);
    expect(template.isModifiedPostPublish).toBe(false);
  });

  it('requires a document subtype for accounting document templates', () => {
    const MessageTemplate = getMessageTemplateModel();
    const template = new MessageTemplate({
      name: 'Invoice share',
      subject: 'Invoice {{document.number}}',
      body: 'Hello {{customer.name}}',
      templateType: 'ACCOUNTING_DOCUMENTS',
      business: new mongoose.Types.ObjectId(FIXED_APP_CONTEXT.business.id),
      createdBy: new mongoose.Types.ObjectId(FIXED_APP_CONTEXT.user.id),
    });

    const error = template.validateSync();

    expect(error?.errors.documentSubtype?.message).toMatch(/required/i);
  });

  it('allows crm templates without a document subtype', () => {
    const MessageTemplate = getMessageTemplateModel();
    const template = new MessageTemplate({
      name: 'Lead Follow-up',
      subject: 'Checking in',
      body: 'Hello {{contact.name}}',
      templateType: 'SALES_CRM',
      business: new mongoose.Types.ObjectId(FIXED_APP_CONTEXT.business.id),
      createdBy: new mongoose.Types.ObjectId(FIXED_APP_CONTEXT.user.id),
    });

    expect(template.validateSync()).toBeUndefined();
  });
});
