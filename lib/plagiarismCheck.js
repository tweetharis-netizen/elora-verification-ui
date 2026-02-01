// lib/plagiarismCheck.js
// Plagiarism detection utilities

/**
 * Simple text similarity check using n-gram comparison
 */
export function calculateSimilarity(text1, text2, ngramSize = 3) {
    if (!text1 || !text2) return 0;

    const ngrams1 = extractNgrams(text1.toLowerCase(), ngramSize);
    const ngrams2 = extractNgrams(text2.toLowerCase(), ngramSize);

    const intersection = ngrams1.filter(ng => ngrams2.includes(ng));
    const union = [...new Set([...ngrams1, ...ngrams2])];

    return union.length > 0 ? (intersection.length / union.length) * 100 : 0;
}

/**
 * Extract n-grams from text
 */
function extractNgrams(text, n) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const ngrams = [];

    for (let i = 0; i <= words.length - n; i++) {
        ngrams.push(words.slice(i, i + n).join(' '));
    }

    return ngrams;
}

/**
 * Check submission against previous submissions in the class
 */
export async function checkPlagiarism(content, classSubmissions = []) {
    if (!content || content.trim().length < 100) {
        return {
            score: 0,
            matches: [],
            flagged: false,
            message: 'Text too short for meaningful plagiarism detection',
        };
    }

    const matches = [];
    let highestSimilarity = 0;

    // Compare against each previous submission
    classSubmissions.forEach(submission => {
        if (submission.content) {
            const similarity = calculateSimilarity(content, submission.content);

            if (similarity > 20) { // Threshold of 20% similarity
                matches.push({
                    studentId: submission.studentId,
                    studentName: submission.studentName,
                    similarity: Math.round(similarity),
                    submissionId: submission.id,
                });

                if (similarity > highestSimilarity) {
                    highestSimilarity = similarity;
                }
            }
        }
    });

    // Sort matches by similarity
    matches.sort((a, b) => b.similarity - a.similarity);

    return {
        score: Math.round(highestSimilarity),
        matches: matches.slice(0, 5), // Top 5 matches
        flagged: highestSimilarity > 40, // Flag if > 40% similar
        message: getPlagi arismMessage(highestSimilarity),
    };
}

/**
 * Get user-friendly plagiarism message
 */
function getPlagiarismMessage(score) {
    if (score < 20) return 'No significant similarity detected';
    if (score < 40) return 'Some similarity detected - may be common phrases or citations';
    if (score < 60) return 'Moderate similarity detected - please review';
    if (score < 80) return 'High similarity detected - likely plagiarism';
    return 'Very high similarity - almost certainly plagiarized';
}

/**
 * Check against common essay mills / online sources (mock)
 * In production, this would call an external API
 */
export async function checkOnlineSources(content) {
    // This is a placeholder - in production, integrate with:
    // - Turnitin API
    // - Copyscape API
    // - Custom web scraping

    // For now, return a mock result
    return {
        checked: false,
        sources: [],
        message: 'Online source checking not yet implemented',
    };
}

/**
 * Generate plagiarism report
 */
export function generatePlagiarismReport(plagiarismResult) {
    const report = {
        timestamp: new Date().toISOString(),
        overallScore: plagiarismResult.score,
        flagged: plagiarismResult.flagged,
        summary: plagiarismResult.message,
        matches: plagiarismResult.matches,
        recommendations: [],
    };

    if (plagiarismResult.flagged) {
        report.recommendations.push('Review submission with student');
        report.recommendations.push('Request explanation of similar passages');
        report.recommendations.push('Check for proper citations');
    }

    if (plagiarismResult.score > 60) {
        report.recommendations.push('Consider requesting resubmission');
        report.recommendations.push('Discuss academic integrity with student');
    }

    return report;
}

/**
 * Highlight similar passages (basic implementation)
 */
export function highlightSimilarities(originalText, comparedText, threshold = 0.7) {
    const originalSentences = originalText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const comparedSentences = comparedText.split(/[.!?]+/).filter(s => s.trim().length > 0);

    const highlighted = [];

    originalSentences.forEach((sentence, idx) => {
        let maxSimilarity = 0;
        let matchingSentence = null;

        comparedSentences.forEach(compSentence => {
            const sim = calculateSimilarity(sentence, compSentence, 2) / 100;
            if (sim > maxSimilarity) {
                maxSimilarity = sim;
                matchingSentence = compSentence;
            }
        });

        highlighted.push({
            text: sentence.trim(),
            similarity: maxSimilarity,
            flagged: maxSimilarity >= threshold,
            match: maxSimilarity >= threshold ? matchingSentence : null,
        });
    });

    return highlighted;
}
