'use client';

import { useCallback, useEffect, useState } from 'react';

import type { SerializedMessageTemplate, TemplateListResponse } from '@/types/messageTemplate';

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Something went wrong');
  }

  return data as T;
}

export function useTemplates() {
  const [templates, setTemplates] = useState<SerializedMessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/templates', {
        cache: 'no-store',
      });
      const data = await parseJsonResponse<TemplateListResponse>(response);
      setTemplates(data.data);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to load templates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const patchTemplate = useCallback(
    async (templateId: string, payload: Record<string, unknown>) => {
      setActiveTemplateId(templateId);
      setError(null);

      try {
        const response = await fetch(`/api/templates/${templateId}`, {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        await parseJsonResponse(response);
        await fetchTemplates();
      } catch (patchError) {
        setError(patchError instanceof Error ? patchError.message : 'Unable to update template');
      } finally {
        setActiveTemplateId(null);
      }
    },
    [fetchTemplates],
  );

  return {
    templates,
    isLoading,
    error,
    activeTemplateId,
    fetchTemplates,
    patchTemplate,
  };
}
