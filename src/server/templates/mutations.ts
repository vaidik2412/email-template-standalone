import { Types } from 'mongoose';

const PUBLISHABLE_FIELDS = ['name', 'subject', 'body'] as const;

type PublishableField = (typeof PUBLISHABLE_FIELDS)[number];

type TemplateMutationInput = Partial<
  Record<PublishableField | 'isArchived' | 'isRemoved', string | boolean>
> & {
  [key: string]: unknown;
};

type MutationOptions = {
  actorId: string;
  isPublished?: boolean;
};

export function applyTemplateMutation<T extends TemplateMutationInput>(
  input: T,
  options: MutationOptions,
) {
  const { actorId, isPublished = false } = options;
  const mutation = { ...input } as T & {
    archived?: { by: Types.ObjectId };
    removed?: { by: Types.ObjectId };
    published?: Partial<Record<PublishableField, string>>;
    status?: 'LIVE';
    isModifiedPostPublish?: boolean;
    lastPublished?: Date;
    isArchived?: boolean;
  };

  if (mutation.isArchived) {
    mutation.archived = {
      by: new Types.ObjectId(actorId),
    };
  }

  if (mutation.isRemoved) {
    mutation.removed = {
      by: new Types.ObjectId(actorId),
    };
  }

  if (isPublished) {
    const published = PUBLISHABLE_FIELDS.reduce(
      (acc, field) => {
        const value = mutation[field];

        if (typeof value === 'string' && value) {
          acc[field] = value;
        }

        return acc;
      },
      {} as Partial<Record<PublishableField, string>>,
    );

    mutation.published = published;
    mutation.status = 'LIVE';
    mutation.isModifiedPostPublish = false;
    mutation.lastPublished = new Date();
    mutation.isArchived = false;

    return mutation;
  }

  mutation.isModifiedPostPublish = true;

  return mutation;
}
