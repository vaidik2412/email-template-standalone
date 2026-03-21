import { Types } from 'mongoose';

import { FIXED_APP_CONTEXT } from '../constants/fixedContext';

export function getTemplateScopeQuery() {
  return {
    business: new Types.ObjectId(FIXED_APP_CONTEXT.business.id),
    channel: 'EMAIL' as const,
  };
}

export function getVisibleTemplateQuery() {
  return {
    ...getTemplateScopeQuery(),
    isRemoved: false,
  };
}
