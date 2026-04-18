import { useEffect, useRef } from 'react';
import { askElora } from '../services/askElora';
import type { Message } from '../components/Copilot/CopilotShared';

export type UseAutoTitleOptions = {
    /** The server-side conversation ID. Hook is a no-op while null. */
    conversationId: string | null;
    /** Current messages in the active chat. */
    messages: Message[];
    /** Current title stored on the thread. Used to detect whether auto-title would overwrite a manual rename. */
    currentTitle: string;
    /** Called with the generated title when the LLM responds. */
    onTitleGenerated: (title: string) => void;
    /**
     * Must be false in demo mode or when there is no server conversation.
     * Prevents any secondary AI call from firing.
     */
    enabled: boolean;
};

/** Week-/ class-derived placeholder patterns that the auto-titler should replace. */
const PLACEHOLDER_PATTERNS = [
    /^week of /i,
    /^this week/i,
    /^previous thread/i,
    /^active thread$/i,
    /^overview$/i,
];

function isPlaceholderTitle(title: string): boolean {
    const t = title.trim();
    if (!t) return true;
    return PLACEHOLDER_PATTERNS.some((p) => p.test(t));
}

/**
 * After the first user ↔ assistant exchange this hook fires a short, fire-and-forget
 * `/api/ai/ask` call to generate a 4-word title for the conversation.
 *
 * It fires **at most once per conversation** (tracked via hasFiredRef).
 * The hook will not overwrite a title that was manually set by the user.
 */
export function useAutoTitle({
    conversationId,
    messages,
    currentTitle,
    onTitleGenerated,
    enabled,
}: UseAutoTitleOptions): void {
    const hasFiredRef = useRef<string | null>(null); // stores the conversationId for which we've already fired

    useEffect(() => {
        if (!enabled) return;
        if (!conversationId) return;

        // Only fire for placeholder/default titles — never overwrite a manual rename.
        if (!isPlaceholderTitle(currentTitle)) return;

        // Need at least one user message and one assistant reply.
        const userMessages = messages.filter((m) => m.role === 'user');
        const assistantMessages = messages.filter((m) => m.role === 'assistant');
        if (userMessages.length === 0 || assistantMessages.length === 0) return;

        // Guard: fire only once per conversation.
        if (hasFiredRef.current === conversationId) return;
        hasFiredRef.current = conversationId;

        // Build a minimal context string from the very first exchange.
        const firstUser = userMessages[0].content.slice(0, 300);
        const firstAssistant = assistantMessages[0].content.slice(0, 300);

        const titlePrompt =
            'In 4 words or fewer, summarize this conversation as a chat title for a teacher Copilot. ' +
            'Reply with the title only, no quotes, no punctuation at the end.';

        const contextStr =
            `Teacher asked: "${firstUser}"\n` +
            `Copilot replied: "${firstAssistant}"`;

        // Fire-and-forget: errors are swallowed so they never surface to the UI.
        (async () => {
            try {
                const raw = await askElora({
                    message: titlePrompt,
                    role: 'teacher',
                    context: contextStr,
                    isFirstMessage: false,
                    conversationId: null, // don't attach this to the conversation thread
                });

                const title = raw
                    .trim()
                    .replace(/^["']|["']$/g, '') // strip surrounding quotes if LLM adds them
                    .slice(0, 80);

                if (title) {
                    onTitleGenerated(title);
                }
            } catch {
                // Silently swallow — auto-title is non-critical
            }
        })();
    }, [conversationId, messages, currentTitle, enabled, onTitleGenerated]);
}
