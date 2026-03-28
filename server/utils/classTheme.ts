export type ServerClassThemeColor = 'teal' | 'emerald' | 'indigo' | 'amber' | 'slate';
export type ServerClassBannerStyle = 'default' | 'math' | 'science' | 'language' | 'arts';

function normalizeThemeColor(themeColor?: string): ServerClassThemeColor | undefined {
    if (!themeColor) return undefined;
    const normalized = themeColor.toLowerCase().trim();
    const aliasNormalized = normalized === 'mint' ? 'emerald' : normalized;

    if (
        aliasNormalized === 'teal' ||
        aliasNormalized === 'emerald' ||
        aliasNormalized === 'indigo' ||
        aliasNormalized === 'amber' ||
        aliasNormalized === 'slate'
    ) {
        return aliasNormalized;
    }
    return undefined;
}

function normalizeBannerStyle(bannerStyle?: string): ServerClassBannerStyle | undefined {
    if (!bannerStyle) return undefined;
    const normalized = bannerStyle.toLowerCase().trim();
    if (
        normalized === 'default' ||
        normalized === 'math' ||
        normalized === 'science' ||
        normalized === 'language' ||
        normalized === 'arts'
    ) {
        return normalized;
    }
    return undefined;
}

export function getSubjectThemeDefaults(subject?: string): {
    themeColor: ServerClassThemeColor;
    bannerStyle: ServerClassBannerStyle;
} {
    const lowered = (subject || '').toLowerCase();

    if (lowered.includes('math') || lowered.includes('mathematics')) {
        return { themeColor: 'teal', bannerStyle: 'math' };
    }
    if (lowered.includes('science')) {
        return { themeColor: 'emerald', bannerStyle: 'science' };
    }
    if (lowered.includes('english') || lowered.includes('language') || lowered.includes('literature')) {
        return { themeColor: 'indigo', bannerStyle: 'language' };
    }
    return { themeColor: 'slate', bannerStyle: 'default' };
}

export function resolveClassThemeSettings({
    subject,
    themeColor,
    bannerStyle,
}: {
    subject?: string;
    themeColor?: string;
    bannerStyle?: string;
} = {}): {
    themeColor: ServerClassThemeColor;
    bannerStyle: ServerClassBannerStyle;
} {
    const defaults = getSubjectThemeDefaults(subject);
    return {
        themeColor: normalizeThemeColor(themeColor) ?? defaults.themeColor,
        bannerStyle: normalizeBannerStyle(bannerStyle) ?? defaults.bannerStyle,
    };
}