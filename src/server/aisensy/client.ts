/**
 * AiSensy Project API client.
 *
 * Auth: header `X-AiSensy-Project-API-Pwd: <project api key>`
 * Base: https://apis.aisensy.com/project-apis/v1/project/{project_id}
 *
 * Reference: https://aisensy.stoplight.io/docs/project-api/c5fafc9547b52-submit-whats-app-template-message
 */

const DEFAULT_BASE_URL = 'https://apis.aisensy.com';

const PROJECT_PATH = (projectId: string) => `/project-apis/v1/project/${projectId}`;

const ENDPOINTS = {
  createTemplate: '/wa_template',
  /** Look up by AiSensy's internal wa_template_id, not by the Meta template name. */
  getTemplate: (waTemplateId: string) => `/wa_template/${encodeURIComponent(waTemplateId)}`,
  listTemplates: '/wa_templates',
} as const;

export type AisensyEnv = {
  baseUrl: string;
  projectId: string;
  apiKey: string;
};

export class AisensyError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export function readAisensyEnv(): AisensyEnv | null {
  const apiKey = process.env.AISENSY_PROJECT_API_KEY;
  const projectId = process.env.AISENSY_PROJECT_ID;
  if (!apiKey || !projectId) return null;
  return {
    baseUrl: process.env.AISENSY_BASE_URL || DEFAULT_BASE_URL,
    projectId,
    apiKey,
  };
}

async function aisensyFetch<T>(
  env: AisensyEnv,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${env.baseUrl}${PROJECT_PATH(env.projectId)}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-AiSensy-Project-API-Pwd': env.apiKey,
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const message =
      (parsed && typeof parsed === 'object' && 'message' in parsed && typeof (parsed as { message: unknown }).message === 'string'
        ? (parsed as { message: string }).message
        : null) || `AiSensy ${response.status}`;
    throw new AisensyError(message, response.status, parsed);
  }

  return parsed as T;
}

/* --------------------------- AiSensy template shape --------------------------- */

export type AisensyTemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';

/** Header type — `NONE` when no header. AiSensy uses `FILE`/`IMAGE`/`VIDEO`/`TEXT`. */
export type AisensyTemplateHeaderType = 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE';

export type AisensyMessageActionType = 'NONE' | 'CTA' | 'QUICK_REPLY';

export type AisensyCallToActionButton =
  | { type: 'URL'; button_title: string; button_value: string }
  | { type: 'Phone Number'; button_title: string; button_value: string };

export type AisensyQuickReply = { button_title: string };

/**
 * Body shape that AiSensy's create-template endpoint accepts.
 * Mirrors the curl from the Stoplight docs:
 *   POST /project-apis/v1/project/{project_id}/wa_template
 */
export type AisensyCreateTemplatePayload = {
  name: string;
  label?: string;
  category: AisensyTemplateCategory;
  language: string;
  type: AisensyTemplateHeaderType;
  /** Body text using positional placeholders {{1}}, {{2}}, ... */
  text: string;
  /** Body text with placeholders replaced by example values, for Meta review. */
  sample_text?: string;
  /** Header text for `type: TEXT`. */
  header_text?: string;
  sample_header_text?: string;
  footer?: string;
  message_action_type: AisensyMessageActionType;
  call_to_action?: AisensyCallToActionButton[] | null;
  quick_replies?: AisensyQuickReply[] | null;
};

export type AisensyTemplateStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_APPEAL'
  | 'PAUSED'
  | 'DISABLED'
  | 'PENDING_DELETION'
  | 'DELETED';

export type AisensyTemplateRecord = {
  id?: string;
  _id?: string;
  name: string;
  status: AisensyTemplateStatus;
  category?: AisensyTemplateCategory;
  language?: string;
  rejected_reason?: string;
};

/* ---------------------------------- Methods ---------------------------------- */

export async function createWaTemplate(
  payload: AisensyCreateTemplatePayload,
  env: AisensyEnv = requireAisensyEnv(),
): Promise<AisensyTemplateRecord> {
  return aisensyFetch<AisensyTemplateRecord>(env, ENDPOINTS.createTemplate, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getWaTemplate(
  waTemplateId: string,
  env: AisensyEnv = requireAisensyEnv(),
): Promise<AisensyTemplateRecord> {
  return aisensyFetch<AisensyTemplateRecord>(env, ENDPOINTS.getTemplate(waTemplateId));
}

function requireAisensyEnv(): AisensyEnv {
  const env = readAisensyEnv();
  if (!env) {
    throw new AisensyError(
      'AiSensy is not configured: set AISENSY_PROJECT_API_KEY and AISENSY_PROJECT_ID',
      500,
      null,
    );
  }
  return env;
}
