export class TemplateNotFoundError extends Error {
  constructor(templateId: string) {
    super(`Template ${templateId} not found`);
    this.name = 'TemplateNotFoundError';
  }
}

export class TemplatePayloadValidationError extends Error {
  status: number;

  constructor(message: string) {
    super(message);
    this.name = 'TemplatePayloadValidationError';
    this.status = 400;
  }
}
