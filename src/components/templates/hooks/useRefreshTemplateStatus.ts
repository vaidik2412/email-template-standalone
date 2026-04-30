'use client';

import { useCallback, useState } from 'react';

import type { SerializedMessageTemplate } from '@/types/messageTemplate';

export function useRefreshTemplateStatus() {
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const refresh = useCallback(
    async (templateId: string): Promise<SerializedMessageTemplate | null> => {
      setIsRefreshing(templateId);
      setRefreshError(null);
      try {
        const response = await fetch(`/api/templates/${templateId}/refresh-status`, {
          method: 'POST',
        });
        const data = (await response.json()) as SerializedMessageTemplate & { message?: string };
        if (!response.ok) {
          const message = data.message || 'Failed to refresh status';
          setRefreshError(message);
          return null;
        }
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to refresh status';
        setRefreshError(message);
        return null;
      } finally {
        setIsRefreshing(null);
      }
    },
    [],
  );

  return { refresh, isRefreshing, refreshError };
}
