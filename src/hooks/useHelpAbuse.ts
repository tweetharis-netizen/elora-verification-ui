import { useCallback } from 'react';

const KEY_PREFIX = 'elora:helpAbuse:';

export const getHelpAbuseCount = (conversationId?: string): number => {
  if (!conversationId) return 0;
  const raw = sessionStorage.getItem(KEY_PREFIX + conversationId);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
};

export const incrementHelpAbuse = (conversationId?: string): number => {
  if (!conversationId) return 0;
  const key = KEY_PREFIX + conversationId;
  const current = getHelpAbuseCount(conversationId);
  const next = current + 1;
  sessionStorage.setItem(key, String(next));
  return next;
};

export const resetHelpAbuse = (conversationId?: string) => {
  if (!conversationId) return;
  sessionStorage.removeItem(KEY_PREFIX + conversationId);
};

export const useHelpAbuse = (conversationId?: string) => {
  const get = useCallback(() => getHelpAbuseCount(conversationId), [conversationId]);
  const inc = useCallback(() => incrementHelpAbuse(conversationId), [conversationId]);
  const reset = useCallback(() => resetHelpAbuse(conversationId), [conversationId]);
  return { get, inc, reset };
};

export default useHelpAbuse;
