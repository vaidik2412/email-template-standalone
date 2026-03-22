import type { DocumentTemplateSubtypeKey } from '../data/email/documentSubtypes';
import type { EmailTemplateTypeKey } from '../data/email/templateTypes';

export type TemplateVariableOption = {
  label: string;
  value: string;
  group: string;
  scope: EmailTemplateTypeKey;
  sampleValue?: string;
  dataType?: string;
  bodyOnly?: boolean;
  insertBehavior?: 'token' | 'documentShareLinkCta';
};

export type TemplateVariableCatalog = {
  templateType: EmailTemplateTypeKey;
  documentSubtype?: DocumentTemplateSubtypeKey;
  options: TemplateVariableOption[];
};
