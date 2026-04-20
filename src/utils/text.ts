export function compactTitle(
    title: string,
    options?: {
        maxWords?: number;
        maxChars?: number;
        maxTokenLength?: number;
    }
): string {
    const { maxWords = 5, maxChars = 48, maxTokenLength = 16 } = options || {};

    const raw = (title || '').trim();
    if (!raw) return 'Untitled conversation';

    const words = raw.split(/\s+/);
    const limitedWords = words.slice(0, maxWords).map((word) => {
        if (word.length <= maxTokenLength) return word;
        return `${word.slice(0, maxTokenLength)}...`;
    });

    let compact = limitedWords.join(' ');

    if (compact.length > maxChars) {
        compact = `${compact.slice(0, Math.max(1, maxChars - 3)).trimEnd()}...`;
    }

    return compact;
}
export function truncateTitleByWords(title: string, maxWords = 5): string {
	const normalized = title.trim();
	if (!normalized) return '';

	const safeMaxWords = Number.isFinite(maxWords) && maxWords > 0 ? Math.floor(maxWords) : 5;
	const words = normalized.split(/\s+/);

	if (words.length <= safeMaxWords) return normalized;
	return `${words.slice(0, safeMaxWords).join(' ')}...`;
}
