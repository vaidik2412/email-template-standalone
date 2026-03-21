export const EMAIL_TEMPLATE_VARIABLE_OPTIONS = [
  {
    label: 'Contact Name',
    value: 'contact.name',
  },
  {
    label: 'Contact Email',
    value: 'contact.email',
  },
  {
    label: 'Contact Phone',
    value: 'contact.phone',
  },
  {
    label: 'Contact Country',
    value: 'contact.country',
  },
  {
    label: 'Company Name',
    value: 'company.name',
  },
  {
    label: 'My name',
    value: 'my.name',
  },
  {
    label: 'My phone',
    value: 'my.phone',
  },
  {
    label: 'My business',
    value: 'my.business',
  },
  {
    label: 'Business name',
    value: 'business.name',
  },
] as const;

export const EMAIL_TEMPLATE_VARIABLE_KEYS = EMAIL_TEMPLATE_VARIABLE_OPTIONS.map(
  ({ value }) => value,
);
