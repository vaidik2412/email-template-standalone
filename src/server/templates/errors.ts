export class TemplateNotFoundError extends Error {
  constructor(templateId: string) {
    super(`Template ${templateId} not found`);
    this.name = 'TemplateNotFoundError';
  }
}
