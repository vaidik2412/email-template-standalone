import type { SerializedMessageTemplate } from '@/types/messageTemplate';

import { getTemplateVariableCatalog } from '../templateVariables/service';
import {
  AisensyError,
  createWaTemplate,
  getWaTemplate,
  readAisensyEnv,
  type AisensyTemplateRecord,
  type AisensyTemplateStatus,
} from './client';
import { buildAisensyCreatePayload } from './translateTemplate';

export type PublishOutcome = {
  templateName: string;
  templateId?: string;
  status: AisensyTemplateStatus;
  rejectedReason?: string;
  /** True when AiSensy isn't configured — caller can decide what to do. */
  skipped?: boolean;
};

async function buildPreviewValueMap(template: SerializedMessageTemplate): Promise<Record<string, string>> {
  const catalog = await getTemplateVariableCatalog({
    templateType: template.templateType,
    documentSubtype: template.documentSubtype,
  });

  return catalog.options.reduce<Record<string, string>>((acc, option) => {
    if (typeof option.sampleValue === 'string' && option.sampleValue) {
      acc[option.value] = option.sampleValue;
    }
    return acc;
  }, {});
}

/**
 * Submit a published WhatsApp template to AiSensy. If the env keys aren't
 * configured we return `skipped: true` so the publish flow degrades gracefully
 * during local dev (the DB write still succeeds, status stays PENDING).
 */
export async function submitTemplateToAisensy(
  template: SerializedMessageTemplate,
): Promise<PublishOutcome> {
  if (!readAisensyEnv()) {
    return { templateName: '', status: 'PENDING', skipped: true };
  }

  if (template.channel !== 'WHATSAPP' || !template.whatsapp) {
    throw new Error('Only WhatsApp templates can be submitted to AiSensy');
  }

  const previewValueMap = await buildPreviewValueMap(template);
  const payload = buildAisensyCreatePayload(template, previewValueMap);
  const record = await createWaTemplate(payload);

  return {
    templateName: record.name || payload.name,
    templateId: record.id || record._id,
    status: (record.status as AisensyTemplateStatus) || 'PENDING',
    rejectedReason: record.rejected_reason,
  };
}

/**
 * Re-fetch a template's current status from AiSensy. Returns null when AiSensy
 * is not configured or when the template hasn't been submitted yet (no
 * AiSensy-side wa_template_id stored).
 */
export async function fetchTemplateStatusFromAisensy(
  waTemplateId: string | undefined,
): Promise<AisensyTemplateRecord | null> {
  if (!waTemplateId) return null;
  if (!readAisensyEnv()) return null;

  try {
    return await getWaTemplate(waTemplateId);
  } catch (error) {
    if (error instanceof AisensyError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
