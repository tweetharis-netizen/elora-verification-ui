// lib/contentModeration.js
// Content moderation and safety features

import Filter from 'bad-words';

const filter = new Filter();

// Additional education-related inappropriate words
const customBadWords = [
    // Add education-specific inappropriate terms as needed
];

filter.addWords(...customBadWords);

/**
 * Check if content contains inappropriate language
 */
export function containsProfanity(text) {
    if (!text || typeof text !== 'string') return false;
    return filter.isProfane(text);
}

/**
 * Clean profanity from text
 */
export function cleanProfanity(text) {
    if (!text || typeof text !== 'string') return text;
    return filter.clean(text);
}

/**
 * Check if content is age-appropriate
 * Returns { appropriate: boolean, reasons: string[] }
 */
export function checkAgeAppropriate(content, studentAge) {
    const reasons = [];

    // Check for profanity
    if (containsProfanity(content)) {
        reasons.push('Contains inappropriate language');
    }

    // Check for concerning topics (basic keyword matching)
    const concerningTopics = [
        'violence', 'drug', 'alcohol', 'weapon', 'suicide',
        'self-harm', 'gambling', 'sexual', 'explicit'
    ];

    const lowerContent = content.toLowerCase();
    concerningTopics.forEach(topic => {
        if (lowerContent.includes(topic)) {
            reasons.push(`Contains potentially inappropriate content: ${topic}`);
        }
    });

    // Age-specific checks
    if (studentAge < 13) {
        // Stricter filtering for younger students
        const youngStudentFlags = ['dating', 'romantic', 'mature'];
        youngStudentFlags.forEach(flag => {
            if (lowerContent.includes(flag)) {
                reasons.push(`Content may not be appropriate for age ${studentAge}`);
            }
        });
    }

    return {
        appropriate: reasons.length === 0,
        reasons,
    };
}

/**
 * Check for bullying or harassment indicators
 */
export function detectBullying(text) {
    if (!text || typeof text !== 'string') return { flagged: false, indicators: [] };

    const indicators = [];
    const lowerText = text.toLowerCase();

    // Bullying keywords
    const bullyingKeywords = [
        'stupid', 'dumb', 'idiot', 'loser', 'ugly', 'fat',
        'hate you', 'kill yourself', 'nobody likes',
        'everyone hates', 'worthless', 'pathetic'
    ];

    bullyingKeywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
            indicators.push(`Potential bullying language: "${keyword}"`);
        }
    });

    // Excessive caps (yelling)
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.6 && text.length > 10) {
        indicators.push('Excessive use of capital letters (yelling)');
    }

    // Excessive punctuation
    const exclamationCount = (text.match(/!/g) || []).length;
    if (exclamationCount > 5) {
        indicators.push('Excessive punctuation suggesting aggressive tone');
    }

    return {
        flagged: indicators.length > 0,
        indicators,
        severity: indicators.length >= 2 ? 'high' : 'medium',
    };
}

/**
 * Check for spam or irrelevant content
 */
export function detectSpam(text) {
    if (!text || typeof text !== 'string') return false;

    const lowerText = text.toLowerCase();

    // Repeated characters
    if (/(.)\1{10,}/.test(text)) return true;

    // Excessive emojis
    const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
    if (emojiCount > text.length / 3) return true;

    // Common spam phrases
    const spamPhrases = ['click here', 'buy now', 'limited time', 'act now', 'free money'];
    return spamPhrases.some(phrase => lowerText.includes(phrase));
}

/**
 * Moderate chat message
 * Returns { allowed: boolean, cleanedText: string, warnings: string[] }
 */
export function moderateChatMessage(text, studentAge = 13) {
    const warnings = [];
    let cleanedText = text;

    // Check profanity
    if (containsProfanity(text)) {
        cleanedText = cleanProfanity(text);
        warnings.push('Message contained inappropriate language and was filtered');
    }

    // Check age-appropriate
    const ageCheck = checkAgeAppropriate(text, studentAge);
    if (!ageCheck.appropriate) {
        warnings.push(...ageCheck.reasons);
    }

    // Check bullying
    const bullyingCheck = detectBullying(text);
    if (bullyingCheck.flagged) {
        warnings.push(...bullyingCheck.indicators);
    }

    // Check spam
    if (detectSpam(text)) {
        warnings.push('Message appears to be spam');
    }

    // Determine if message should be allowed
    const allowed = !bullyingCheck.flagged && ageCheck.appropriate && !detectSpam(text);

    return {
        allowed,
        cleanedText,
        warnings,
        requiresReview: bullyingCheck.severity === 'high' || !ageCheck.appropriate,
    };
}

/**
 * Generate content report for teachers
 */
export function generateContentReport(messages) {
    const report = {
        totalMessages: messages.length,
        flaggedMessages: 0,
        profanityCount: 0,
        bullyingIncidents: 0,
        spamCount: 0,
        details: [],
    };

    messages.forEach(msg => {
        const moderation = moderateChatMessage(msg.content, msg.studentAge);

        if (!moderation.allowed || moderation.warnings.length > 0) {
            report.flaggedMessages++;

            if (containsProfanity(msg.content)) report.profanityCount++;
            if (detectBullying(msg.content).flagged) report.bullyingIncidents++;
            if (detectSpam(msg.content)) report.spamCount++;

            report.details.push({
                messageId: msg.id,
                studentId: msg.studentId,
                timestamp: msg.timestamp,
                warnings: moderation.warnings,
                requiresReview: moderation.requiresReview,
            });
        }
    });

    return report;
}

/**
 * Parental control settings
 */
export const ParentalControlLevels = {
    STRICT: {
        name: 'Strict',
        description: 'Maximum filtering and monitoring',
        settings: {
            blockProfanity: true,
            requireTeacherApproval: true,
            chatEnabled: false,
            peerReviewEnabled: false,
            maxDailyTime: 60, // minutes
        },
    },
    MODERATE: {
        name: 'Moderate',
        description: 'Balanced safety and autonomy',
        settings: {
            blockProfanity: true,
            requireTeacherApproval: false,
            chatEnabled: true,
            peerReviewEnabled: true,
            maxDailyTime: 120,
        },
    },
    RELAXED: {
        name: 'Relaxed',
        description: 'Minimal restrictions for older students',
        settings: {
            blockProfanity: true,
            requireTeacherApproval: false,
            chatEnabled: true,
            peerReviewEnabled: true,
            maxDailyTime: null,
        },
    },
};
