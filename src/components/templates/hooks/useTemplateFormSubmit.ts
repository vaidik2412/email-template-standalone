'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { SerializedMessageTemplate, TemplateWritePayload } from '@/types/messageTemplate';

type UseTemplateFormSubmitOptions = {
  mode: 'create' | 'edit';
  templateId?: string;
};

async function parseJsonResponse<T>(response: Response) {
  const data = (await response.json()) as T & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export function useTemplateFormSubmit({ mode, templateId }: UseTemplateFormSubmitOptions) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitTemplate = useCallback(
    async (payload: TemplateWritePayload, isPublished: boolean) => {
      setSubmitError(null);
      setIsSubmitting(true);

      try {
        const isEditMode = mode === 'edit';
        const endpoint = isEditMode ? `/api/templates/${templateId}` : '/api/templates';
        const url = isPublished ? `${endpoint}?isPublished=true` : endpoint;

        const response = await fetch(url, {
          method: isEditMode ? 'PATCH' : 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const template = await parseJsonResponse<SerializedMessageTemplate>(response);

        if (isEditMode) {
          router.push('/templates');
        } else {
          router.push(`/templates/${template._id}/edit`);
        }

        return template;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to save template';
        setSubmitError(message);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, router, templateId],
  );

  return {
    submitTemplate,
    submitError,
    isSubmitting,
  };
}
