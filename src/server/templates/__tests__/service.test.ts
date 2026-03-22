import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';

const { connectToDatabase, getMessageTemplateModel, validateTemplateVariableUsage } = vi.hoisted(
  () => ({
    connectToDatabase: vi.fn(),
    getMessageTemplateModel: vi.fn(),
    validateTemplateVariableUsage: vi.fn(),
  }),
);

vi.mock('../../db', () => ({
  connectToDatabase,
}));

vi.mock('../../models/messageTemplate', () => ({
  getMessageTemplateModel,
}));

vi.mock('../../templateVariables/service', () => ({
  validateTemplateVariableUsage,
}));

import { createTemplate, listTemplates, updateTemplate } from '../service';

function buildStoredTemplate(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-03-22T00:00:00.000Z');

  return {
    _id: new Types.ObjectId(),
    name: 'Reminder',
    subject: '',
    body: 'Hello {{contact.name}}',
    status: 'DRAFT',
    channel: 'WHATSAPP',
    templateType: 'SALES_CRM',
    documentSubtype: undefined,
    isModifiedPostPublish: false,
    isDefault: false,
    isArchived: false,
    isRemoved: false,
    createdBy: new Types.ObjectId(),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('template service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectToDatabase.mockResolvedValue(undefined);
    validateTemplateVariableUsage.mockResolvedValue(undefined);
  });

  it('creates whatsapp templates with the requested channel', async () => {
    const create = vi.fn().mockResolvedValue({
      toObject: () =>
        buildStoredTemplate({
          channel: 'WHATSAPP',
        }),
    });

    getMessageTemplateModel.mockReturnValue({
      create,
    });

    const result = await createTemplate({
      channel: 'WHATSAPP',
      name: 'Reminder',
      body: 'Hello {{contact.name}}',
      templateType: 'SALES_CRM',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'WHATSAPP',
      }),
    );
    expect(result.channel).toBe('WHATSAPP');
  });

  it('preserves the original channel when updating an existing template', async () => {
    const existingTemplate = buildStoredTemplate({
      channel: 'WHATSAPP',
    });
    const findOne = vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue(existingTemplate),
    });
    const findOneAndUpdate = vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue(
        buildStoredTemplate({
          channel: 'WHATSAPP',
          body: 'Updated body',
        }),
      ),
    });

    getMessageTemplateModel.mockReturnValue({
      findOne,
      findOneAndUpdate,
    });

    const result = await updateTemplate(existingTemplate._id.toString(), {
      channel: 'EMAIL',
      body: 'Updated body',
    });

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        $set: expect.not.objectContaining({
          channel: 'EMAIL',
        }),
      }),
      expect.any(Object),
    );
    expect(result.channel).toBe('WHATSAPP');
  });

  it('still seeds default email templates when whatsapp templates already exist', async () => {
    const countDocuments = vi.fn().mockResolvedValue(0);
    const insertMany = vi.fn().mockResolvedValue(undefined);
    const findOne = vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });
    const find = vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          buildStoredTemplate({
            channel: 'WHATSAPP',
          }),
        ]),
      }),
    });

    getMessageTemplateModel.mockReturnValue({
      countDocuments,
      findOne,
      find,
      insertMany,
    });

    await listTemplates();

    expect(insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          channel: 'EMAIL',
          isDefault: true,
        }),
      ]),
    );
  });
});
