/**
 * Educational Web Search Service (Stub)
 * 
 * This service provides a safe, limited interface for web search functionality.
 * Currently implemented as a stub that returns null to signal no live access.
 * 
 * Future enhancements could integrate with:
 * - Educational-specific search APIs (Scholar.google.com, Khan Academy, etc.)
 * - Content filtration for age-appropriate results
 * - Citation and source attribution
 * - Homework-aware guardrails
 */

export interface WebSearchResult {
  title: string;
  snippet: string;
  url?: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface WebSearchOptions {
  role?: 'student' | 'teacher' | 'parent';
  limit?: number;
  allowedDomains?: string[];
}

/**
 * Stub educational web search function.
 * 
 * Returns null to signal no live web access available in this environment.
 * When live access is enabled, this function would:
 * 1. Validate query safety (no personal/medical/legal queries)
 * 2. Filter results for educational relevance
 * 3. Return top results with proper attribution
 * 4. Respect homework guardrails
 * 
 * @param query - The search query
 * @param options - Optional search parameters (role, result limit, domain filtering)
 * @returns Array of search results or null if no access available
 */
export async function educationalWebSearch(
  query: string,
  options?: WebSearchOptions
): Promise<WebSearchResult[] | null> {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    console.warn('[educationalWebSearch] received empty query');
    return null;
  }

  console.log('[educationalWebSearch] stub called', {
    query: query.trim(),
    role: options?.role ?? 'unknown',
    limit: options?.limit ?? 5,
  });

  // Stub behavior: no live web access in this environment
  // Return null to signal LLM should use honest disclaimer message
  return null;
}

/**
 * Validate if a query is safe for web search.
 * Prevents searching for personal, medical, legal, or sensitive information.
 * 
 * @param query - The search query to validate
 * @returns true if query is safe; false if it should be blocked
 */
export function isQuerySafeForWebSearch(query: string): boolean {
  if (!query || typeof query !== 'string') return false;

  const lower = query.toLowerCase();

  // Block personal/medical/legal queries
  const blockPatterns = [
    /\b(my medical|my health|my diagnosis|my prescription|personal health|patient history)\b/i,
    /\b(legal advice|lawyer|attorney|sue|lawsuit|contract)\b/i,
    /\b(social security|credit card|bank account|password|ssn)\b/i,
    /\b(personal information|private details|home address|phone number)\b/i,
  ];

  return !blockPatterns.some((pattern) => pattern.test(lower));
}

/**
 * Optional: Filter search results by educational relevance.
 * Used when results are available to ensure quality.
 * 
 * @param results - Raw search results to filter
 * @param role - The user role (affects filtering rules)
 * @returns Filtered results appropriate for the role
 */
export function filterResultsByEducationalRelevance(
  results: WebSearchResult[],
  role: 'student' | 'teacher' | 'parent' = 'student'
): WebSearchResult[] {
  // Stub: return results as-is
  // Future: implement domain filtering, readability checks, etc.
  return results;
}
