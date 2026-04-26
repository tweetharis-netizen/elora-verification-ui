import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import * as dataService from '../services/dataService';

type TeacherClassesResult = {
  data: dataService.TeacherClass[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useTeacherClasses(): TeacherClassesResult {
  const { currentUser } = useAuth();
  const [data, setData] = useState<dataService.TeacherClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'teacher') {
      setData([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const classes = await dataService.getMyClasses();
      setData(classes);
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
    void fetchClasses();
  }, [fetchClasses]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchClasses,
  };
}
