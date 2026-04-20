import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import * as dataService from '../services/dataService';
import type { ParentChildSummary } from '../types/roster';

type ParentChildrenResult = {
  data: ParentChildSummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useParentChildren(): ParentChildrenResult {
  const { currentUser } = useAuth();
  const [data, setData] = useState<ParentChildSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChildren = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'parent') {
      setData([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const children = await dataService.getParentChildren();
      setData(
        children.map((child) => ({
          id: child.id,
          name: child.name,
          classes: child.classes,
        })),
      );
      setError(null);
    } catch (err: unknown) {
      if (err instanceof dataService.RedirectError) {
        setData([]);
        setError('Not authenticated');
      } else {
        const normalized = dataService.toEloraServiceError(err);
        setData([]);
        setError(dataService.getFriendlyServiceErrorMessage(normalized));
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    void fetchChildren();
  }, [fetchChildren]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchChildren,
  };
}
