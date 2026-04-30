import type { AiSensyTemplateApiConfig } from '../config';
import type { WhatsappTemplateSubmissionPayload } from '../whatsapp/submission';

type AiSensyTemplateResult = {
  id?: string;
  name?: string;
  status?: string;
  raw: unknown;
};

export class AiSensyTemplateApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AiSensyTemplateApiError';
    this.status = status;
  }
}

function assertEnabled(config: AiSensyTemplateApiConfig) {
  if (!config.enabled || !config.apiKey || !config.createUrl || !config.statusUrl) {
    throw new AiSensyTemplateApiError(
      'AiSensy template API is not configured. Set AISENSY_TEMPLATE_API_ENABLED=true, AISENSY_PROJECT_API_KEY, AISENSY_TEMPLATE_CREATE_URL, and AISENSY_TEMPLATE_STATUS_URL.',
      503,
    );
  }
}

function buildHeaders(apiKey: string) {
  return {
    authorization: `Bearer ${apiKey}`,
    'content-type': 'application/json',
  };
}

function redactSecrets(message: string, config: AiSensyTemplateApiConfig) {
  let safeMessage = message;

  if (config.apiKey) {
    safeMessage = safeMessage.split(config.apiKey).join('[redacted]');
  }

  return safeMessage;
}

function pickString(value: unknown, keys: string[]) {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;

  for (const key of keys) {
    const candidate = record[key];

    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return undefined;
}

async function parseJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

async function readAiSensyResponse(response: Response, config: AiSensyTemplateApiConfig) {
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    const message =
      pickString(data, ['message', 'error', 'errorMessage']) || response.statusText || 'Request failed';

    throw new AiSensyTemplateApiError(
      `AiSensy template API error (${response.status}): ${redactSecrets(message, config)}`,
      response.status,
    );
  }

  return data;
}

function normalizeTemplateResult(data: unknown): AiSensyTemplateResult {
  return {
    id: pickString(data, ['templateId', 'id', '_id']),
    name: pickString(data, ['templateName', 'name']),
    status: pickString(data, ['status', 'templateStatus']),
    raw: data,
  };
}

export async function submitWhatsappTemplate(
  payload: WhatsappTemplateSubmissionPayload,
  config: AiSensyTemplateApiConfig,
): Promise<AiSensyTemplateResult> {
  assertEnabled(config);

  const response = await fetch(config.createUrl as string, {
    method: 'POST',
    headers: buildHeaders(config.apiKey as string),
    body: JSON.stringify(payload),
  });

  return normalizeTemplateResult(await readAiSensyResponse(response, config));
}

export async function getWhatsappTemplateStatus(
  input: {
    templateId?: string;
    templateName?: string;
  },
  config: AiSensyTemplateApiConfig,
): Promise<AiSensyTemplateResult> {
  assertEnabled(config);

  const statusUrl = config.statusUrl as string;

  if (statusUrl.includes('{wa_template_id}') && !input.templateId) {
    throw new AiSensyTemplateApiError(
      'AiSensy template status URL requires wa_template_id, but this template has no AiSensy template id.',
      400,
    );
  }

  const url = new URL(
    statusUrl.includes('{wa_template_id}')
      ? statusUrl.replace('{wa_template_id}', encodeURIComponent(input.templateId as string))
      : statusUrl,
  );

  if (input.templateId && !statusUrl.includes('{wa_template_id}')) {
    url.searchParams.set('templateId', input.templateId);
  }

  if (input.templateName) {
    url.searchParams.set('templateName', input.templateName);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: buildHeaders(config.apiKey as string),
  });

  return normalizeTemplateResult(await readAiSensyResponse(response, config));
}
