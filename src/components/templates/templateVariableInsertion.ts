export type TemplateVariableTarget = 'subject' | 'body' | 'signature';

export type TemplateVariableInsertionRequest = {
  id: number;
  variableKey: string;
};
