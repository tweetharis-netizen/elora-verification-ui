import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import * as dataService from '../services/dataService';
import type { ClassSummary } from '../types/roster';

type StudentClassesResult = {
  data: ClassSummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useStudentClasses(): StudentClassesResult {
  const { currentUser } = useAuth();
  const [data, setData] = useState<ClassSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'student') {
      setData([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const classes = await dataService.getStudentClassesV2();
      setData(
        classes.map((classItem) => ({
          id: classItem.id,
          name: classItem.name,
          subject: classItem.subject,
          teacherName: classItem.teacherName,
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
    void fetchClasses();
  }, [fetchClasses]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchClasses,
  };
}
