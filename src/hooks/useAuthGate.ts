import { useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';

export function useAuthGate() {
  const { isGuest, isVerified } = useAuth();
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [gateActionName, setGateActionName] = useState<string | undefined>();

  const openGate = useCallback((actionName?: string) => {
    setGateActionName(actionName);
    setIsGateOpen(true);
  }, []);

  const closeGate = useCallback(() => {
    setIsGateOpen(false);
  }, []);

  /**
   * Wraps an action with a gate check.
   * If the user is a guest, it opens the gate modal instead of running the action.
   */
  const withGate = useCallback(<T extends (...args: any[]) => any>(
    action: T,
    actionName?: string
  ) => {
    return ((...args: Parameters<T>) => {
      // If not verified at all, or if they are a guest, gate the action.
      // Note: ProtectedRoute handles non-verified users for pages, 
      // but this hook handles non-verified users for component actions.
      if (!isVerified || isGuest) {
        openGate(actionName);
        return;
      }
      return action(...args);
    }) as T;
  }, [isGuest, isVerified, openGate]);

  return {
    isGuest,
    isVerified,
    isGateOpen,
    gateActionName,
    openGate,
    closeGate,
    withGate
  };
}
