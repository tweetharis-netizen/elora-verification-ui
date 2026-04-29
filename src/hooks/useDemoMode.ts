// src/hooks/useDemoMode.ts
// ── Detect demo mode from the URL ─────────────────────────────────────────────
// isDemo is true when:
//   • The current path starts with /teacher/demo  (dedicated demo route)
//   • OR the query-string contains ?demo=true
//
// This is a tiny, pure hook with no side-effects.

import { useLocation } from 'react-router-dom';
import { isDemoRoutePath } from '../utils/demoContext';

export function useDemoMode(): boolean {
    const { pathname, search } = useLocation();
    if (isDemoRoutePath(pathname)) return true;
    if (new URLSearchParams(search).get('demo') === 'true') return true;
    return false;
}
