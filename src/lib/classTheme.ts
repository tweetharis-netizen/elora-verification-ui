export type ClassThemeColorKey = 'teal' | 'emerald' | 'indigo' | 'amber' | 'slate' | 'purple';
export type ClassBannerStyle = 'default' | 'math' | 'science' | 'language' | 'arts';

export type ClassLike = {
    id: string;
    name: string;
    subject?: string;
    themeColor?: string;
    bannerStyle?: string;
    playfulBackground?: boolean;
};

type ClassThemeColorStyles = {
    banner: string;
    accent: string;
    chipBg: string;
    chipBorder: string;
    chipText: string;
    outlineBorder: string;
    outlineText: string;
    outlineHoverBg: string;
    solidBg: string;
    solidHoverBg: string;
    cardHoverRing: string;
    cardHoverShadow: string;
    tabActiveBg: string;
    tabActiveText: string;
    tabHoverText: string;
    tabUnderline: string;
    headerCodeBorder: string;
    headerSubjectBg: string;
    headerSubjectBorder: string;
    headerSubjectText: string;
    topicBorder: string;
    streamLabelBg: string;
    streamLabelText: string;
    streamIconBg: string;
    streamIconText: string;
    gradesBorder: string;
    nextTopicBg: string;
    nextTopicBorder: string;
    nextTopicText: string;
};

export const CLASS_THEME_COLORS: Record<ClassThemeColorKey, ClassThemeColorStyles> = {
    teal: {
        banner: 'from-teal-600 to-teal-700',
        accent: 'text-teal-500',
        chipBg: 'bg-teal-50',
        chipBorder: 'border-teal-200',
        chipText: 'text-teal-700',
        outlineBorder: 'border-teal-200',
        outlineText: 'text-teal-700',
        outlineHoverBg: 'hover:bg-teal-50',
        solidBg: 'bg-teal-600',
        solidHoverBg: 'hover:bg-teal-700',
        cardHoverRing: 'hover:ring-teal-200/90',
        cardHoverShadow: 'hover:shadow-teal-100/80',
        tabActiveBg: 'bg-teal-100',
        tabActiveText: 'text-teal-800',
        tabHoverText: 'hover:text-teal-700',
        tabUnderline: 'bg-teal-500',
        headerCodeBorder: 'border-teal-200/70',
        headerSubjectBg: 'bg-white/15',
        headerSubjectBorder: 'border-teal-200/70',
        headerSubjectText: 'text-white',
        topicBorder: 'border-teal-400',
        streamLabelBg: 'bg-teal-50',
        streamLabelText: 'text-teal-700',
        streamIconBg: 'bg-teal-100',
        streamIconText: 'text-teal-700',
        gradesBorder: 'border-teal-300',
        nextTopicBg: 'bg-teal-50',
        nextTopicBorder: 'border-teal-200',
        nextTopicText: 'text-teal-800',
    },
    emerald: {
        banner: 'from-emerald-600 to-emerald-700',
        accent: 'text-emerald-500',
        chipBg: 'bg-emerald-50',
        chipBorder: 'border-emerald-200',
        chipText: 'text-emerald-700',
        outlineBorder: 'border-emerald-200',
        outlineText: 'text-emerald-700',
        outlineHoverBg: 'hover:bg-emerald-50',
        solidBg: 'bg-emerald-600',
        solidHoverBg: 'hover:bg-emerald-700',
        cardHoverRing: 'hover:ring-emerald-200/90',
        cardHoverShadow: 'hover:shadow-emerald-100/80',
        tabActiveBg: 'bg-emerald-100',
        tabActiveText: 'text-emerald-800',
        tabHoverText: 'hover:text-emerald-700',
        tabUnderline: 'bg-emerald-500',
        headerCodeBorder: 'border-emerald-200/70',
        headerSubjectBg: 'bg-white/15',
        headerSubjectBorder: 'border-emerald-200/70',
        headerSubjectText: 'text-white',
        topicBorder: 'border-emerald-400',
        streamLabelBg: 'bg-emerald-50',
        streamLabelText: 'text-emerald-700',
        streamIconBg: 'bg-emerald-100',
        streamIconText: 'text-emerald-700',
        gradesBorder: 'border-emerald-300',
        nextTopicBg: 'bg-emerald-50',
        nextTopicBorder: 'border-emerald-200',
        nextTopicText: 'text-emerald-800',
    },
    indigo: {
        banner: 'from-indigo-600 to-indigo-700',
        accent: 'text-indigo-500',
        chipBg: 'bg-indigo-50',
        chipBorder: 'border-indigo-200',
        chipText: 'text-indigo-700',
        outlineBorder: 'border-indigo-200',
        outlineText: 'text-indigo-700',
        outlineHoverBg: 'hover:bg-indigo-50',
        solidBg: 'bg-indigo-600',
        solidHoverBg: 'hover:bg-indigo-700',
        cardHoverRing: 'hover:ring-indigo-200/90',
        cardHoverShadow: 'hover:shadow-indigo-100/80',
        tabActiveBg: 'bg-indigo-100',
        tabActiveText: 'text-indigo-800',
        tabHoverText: 'hover:text-indigo-700',
        tabUnderline: 'bg-indigo-500',
        headerCodeBorder: 'border-indigo-200/70',
        headerSubjectBg: 'bg-white/15',
        headerSubjectBorder: 'border-indigo-200/70',
        headerSubjectText: 'text-white',
        topicBorder: 'border-indigo-400',
        streamLabelBg: 'bg-indigo-50',
        streamLabelText: 'text-indigo-700',
        streamIconBg: 'bg-indigo-100',
        streamIconText: 'text-indigo-700',
        gradesBorder: 'border-indigo-300',
        nextTopicBg: 'bg-indigo-50',
        nextTopicBorder: 'border-indigo-200',
        nextTopicText: 'text-indigo-800',
    },
    amber: {
        banner: 'from-amber-500 to-amber-600',
        accent: 'text-amber-500',
        chipBg: 'bg-amber-50',
        chipBorder: 'border-amber-200',
        chipText: 'text-amber-700',
        outlineBorder: 'border-amber-200',
        outlineText: 'text-amber-700',
        outlineHoverBg: 'hover:bg-amber-50',
        solidBg: 'bg-amber-600',
        solidHoverBg: 'hover:bg-amber-700',
        cardHoverRing: 'hover:ring-amber-200/90',
        cardHoverShadow: 'hover:shadow-amber-100/80',
        tabActiveBg: 'bg-amber-100',
        tabActiveText: 'text-amber-800',
        tabHoverText: 'hover:text-amber-700',
        tabUnderline: 'bg-amber-500',
        headerCodeBorder: 'border-amber-200/70',
        headerSubjectBg: 'bg-white/15',
        headerSubjectBorder: 'border-amber-200/70',
        headerSubjectText: 'text-white',
        topicBorder: 'border-amber-400',
        streamLabelBg: 'bg-amber-50',
        streamLabelText: 'text-amber-700',
        streamIconBg: 'bg-amber-100',
        streamIconText: 'text-amber-700',
        gradesBorder: 'border-amber-300',
        nextTopicBg: 'bg-amber-50',
        nextTopicBorder: 'border-amber-200',
        nextTopicText: 'text-amber-800',
    },
    slate: {
        banner: 'from-slate-700 to-slate-800',
        accent: 'text-slate-500',
        chipBg: 'bg-slate-100',
        chipBorder: 'border-slate-300',
        chipText: 'text-slate-700',
        outlineBorder: 'border-slate-300',
        outlineText: 'text-slate-700',
        outlineHoverBg: 'hover:bg-slate-100',
        solidBg: 'bg-slate-700',
        solidHoverBg: 'hover:bg-slate-800',
        cardHoverRing: 'hover:ring-slate-200/90',
        cardHoverShadow: 'hover:shadow-slate-200/80',
        tabActiveBg: 'bg-slate-200',
        tabActiveText: 'text-slate-800',
        tabHoverText: 'hover:text-slate-700',
        tabUnderline: 'bg-slate-500',
        headerCodeBorder: 'border-slate-300/70',
        headerSubjectBg: 'bg-white/15',
        headerSubjectBorder: 'border-slate-300/70',
        headerSubjectText: 'text-white',
        topicBorder: 'border-slate-400',
        streamLabelBg: 'bg-slate-100',
        streamLabelText: 'text-slate-700',
        streamIconBg: 'bg-slate-200',
        streamIconText: 'text-slate-700',
        gradesBorder: 'border-slate-300',
        nextTopicBg: 'bg-slate-100',
        nextTopicBorder: 'border-slate-300',
        nextTopicText: 'text-slate-800',
    },
    purple: {
        banner: 'from-[#8b5cf6] to-[#6d28d9]', 
        accent: 'text-purple-500',
        chipBg: 'bg-purple-50',
        chipBorder: 'border-purple-200',
        chipText: 'text-purple-700',
        outlineBorder: 'border-purple-200',
        outlineText: 'text-purple-700',
        outlineHoverBg: 'hover:bg-purple-50',
        solidBg: 'bg-purple-600',
        solidHoverBg: 'hover:bg-purple-700',
        cardHoverRing: 'hover:ring-purple-200/90',
        cardHoverShadow: 'hover:shadow-purple-100/80',
        tabActiveBg: 'bg-purple-100',
        tabActiveText: 'text-purple-800',
        tabHoverText: 'hover:text-purple-700',
        tabUnderline: 'bg-purple-500',
        headerCodeBorder: 'border-purple-200/70',
        headerSubjectBg: 'bg-white/15',
        headerSubjectBorder: 'border-purple-200/70',
        headerSubjectText: 'text-white',
        topicBorder: 'border-purple-400',
        streamLabelBg: 'bg-purple-50',
        streamLabelText: 'text-purple-700',
        streamIconBg: 'bg-purple-100',
        streamIconText: 'text-purple-700',
        gradesBorder: 'border-purple-300',
        nextTopicBg: 'bg-purple-50',
        nextTopicBorder: 'border-purple-200',
        nextTopicText: 'text-purple-800',
    },
};

const BANNER_STYLES: ClassBannerStyle[] = ['default', 'math', 'science', 'language', 'arts'];

export function normalizeThemeColor(themeColor?: string): ClassThemeColorKey | undefined {
    if (!themeColor) return undefined;
    const normalized = themeColor.toLowerCase().trim();
    const aliasNormalized = normalized === 'mint' ? 'emerald' : normalized;
    if (aliasNormalized in CLASS_THEME_COLORS) {
        return aliasNormalized as ClassThemeColorKey;
    }
    return undefined;
}

export function normalizeBannerStyle(bannerStyle?: string): ClassBannerStyle | undefined {
    if (!bannerStyle) return undefined;
    const normalized = bannerStyle.toLowerCase().trim() as ClassBannerStyle;
    return BANNER_STYLES.includes(normalized) ? normalized : undefined;
}

export function getSubjectThemeDefaults(subject?: string): {
    themeColor: ClassThemeColorKey;
    bannerStyle: ClassBannerStyle;
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

export function inferClassTheme(base: ClassLike): {
    themeColor: ClassThemeColorKey;
    bannerStyle: ClassBannerStyle;
    playfulBackground: boolean;
} {
    const defaults = getSubjectThemeDefaults(base.subject);

    return {
        themeColor: normalizeThemeColor(base.themeColor) ?? defaults.themeColor,
        bannerStyle: normalizeBannerStyle(base.bannerStyle) ?? defaults.bannerStyle,
        playfulBackground: typeof base.playfulBackground === 'boolean' ? base.playfulBackground : false,
    };
}

export function resolveClassTheme(themeColor?: string) {
    return CLASS_THEME_COLORS[normalizeThemeColor(themeColor) ?? 'slate'];
}

export function resolveClassThemeSettings({
    subject,
    themeColor,
    bannerStyle,
    playfulBackground,
}: {
    subject?: string;
    themeColor?: string;
    bannerStyle?: string;
    playfulBackground?: boolean;
} = {}): {
    themeColor: ClassThemeColorKey;
    bannerStyle: ClassBannerStyle;
    playfulBackground: boolean;
} {
    return inferClassTheme({
        id: 'theme-settings',
        name: 'Theme settings',
        subject,
        themeColor,
        bannerStyle,
        playfulBackground: playfulBackground,
    });
}

export function getClassThemeVariants({
    subject,
    themeColor,
    bannerStyle,
    playfulBackground,
}: {
    subject?: string;
    themeColor?: string;
    bannerStyle?: string;
    playfulBackground?: boolean;
} = {}) {
    const resolved = resolveClassThemeSettings({ subject, themeColor, bannerStyle, playfulBackground: playfulBackground });
    return {
        ...resolved,
        ...resolveClassTheme(resolved.themeColor),
    };
}

export function applySubjectThemeDefaults<
    T extends {
        subject?: string;
        themeColor?: string;
        bannerStyle?: string;
        playfulBackground?: boolean;
    }
>(classroom: T): T & { themeColor: ClassThemeColorKey; bannerStyle: ClassBannerStyle; playfulBackground: boolean } {
    const resolved = inferClassTheme({
        id: 'classroom',
        name: 'Classroom',
        subject: classroom.subject,
        themeColor: classroom.themeColor,
        bannerStyle: classroom.bannerStyle,
        playfulBackground: classroom.playfulBackground,
    });
    return {
        ...classroom,
        themeColor: resolved.themeColor,
        bannerStyle: resolved.bannerStyle,
        playfulBackground: resolved.playfulBackground,
    };
}