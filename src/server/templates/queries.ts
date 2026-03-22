import { Types } from 'mongoose';

import { FIXED_APP_CONTEXT } from '../constants/fixedContext';

export function getTemplateScopeQuery() {
  return {
    business: new Types.ObjectId(FIXED_APP_CONTEXT.business.id),
  };
}

export function getVisibleTemplateQuery() {
  return {
    ...getTemplateScopeQuery(),
    isRemoved: false,
  };
}
