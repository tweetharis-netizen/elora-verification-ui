// lib/curriculum/standards.js
// Curriculum standards database and matching

/**
 * Comprehensive curriculum standards from multiple countries/systems
 */
export const CURRICULUM_STANDARDS = {
    // US Common Core - Math
    US_CommonCore_Math: {
        K: [
            { id: 'CCSS.MATH.K.CC.A.1', domain: 'Counting & Cardinality', description: 'Count to 100 by ones and by tens', keywords: ['counting', 'numbers'] },
            { id: 'CCSS.MATH.K.CC.B.4', domain: 'Counting & Cardinality', description: 'Understand the relationship between numbers and quantities', keywords: ['number sense', 'quantity'] },
            { id: 'CCSS.MATH.K.OA.A.1', domain: 'Operations', description: 'Represent addition and subtraction', keywords: ['addition', 'subtraction', 'basic operations'] },
        ],
        1: [
            { id: 'CCSS.MATH.1.OA.A.1', domain: 'Operations', description: 'Use addition and subtraction within 20', keywords: ['addition', 'subtraction', 'facts'] },
            { id: 'CCSS.MATH.1.NBT.A.1', domain: 'Number & Operations', description: 'Extend counting sequence to 120', keywords: ['counting', 'place value'] },
            { id: 'CCSS.MATH.1.MD.A.1', domain: 'Measurement', description: 'Order  three objects by length', keywords: ['measurement', 'length', 'comparison'] },
        ],
        2: [
            { id: 'CCSS.MATH.2.OA.A.1', domain: 'Operations', description: 'Use addition and subtraction within 100', keywords: ['addition', 'subtraction', 'two-digit'] },
            { id: 'CCSS.MATH.2.NBT.A.1', domain: 'Number & Operations', description: 'Understand place value', keywords: ['place value', 'hundreds', 'tens', 'ones'] },
            { id: 'CCSS.MATH.2.MD.C.8', domain: 'Measurement', description: 'Solve money problems', keywords: ['money', 'dollars', 'cents'] },
        ],
        3: [
            { id: 'CCSS.MATH.3.OA.A.3', domain: 'Operations', description: 'Use multiplication and division within 100', keywords: ['multiplication', 'division', 'facts'] },
            { id: 'CCSS.MATH.3.NF.A.1', domain: 'Fractions', description: 'Understand fractions as numbers', keywords: ['fractions', 'parts of whole'] },
            { id: 'CCSS.MATH.3.MD.A.2', domain: 'Measurement', description: 'Measure and estimate liquid volumes and masses', keywords: ['measurement', 'volume', 'mass'] },
        ],
        4: [
            { id: 'CCSS.MATH.4.OA.A.3', domain: 'Operations', description: 'Solve multistep word problems', keywords: ['word problems', 'multi-step', 'operations'] },
            { id: 'CCSS.MATH.4.NF.B.3', domain: 'Fractions', description: 'Understand decimal notation for fractions', keywords: ['decimals', 'fractions', 'place value'] },
            { id: 'CCSS.MATH.4.G.A.1', domain: 'Geometry', description: 'Draw and identify lines and angles', keywords: ['geometry', 'lines', 'angles'] },
        ],
        5: [
            { id: 'CCSS.MATH.5.NBT.A.1', domain: 'Number & Operations', description: 'Recognize place value patterns', keywords: ['place value', 'patterns', 'powers of 10'] },
            { id: 'CCSS.MATH.5.NF.A.1', domain: 'Fractions', description: 'Add and subtract fractions with unlike denominators', keywords: ['fractions', 'addition', 'subtraction', 'unlike denominators'] },
            { id: 'CCSS.MATH.5.MD.C.5', domain: 'Measurement', description: 'Relate volume to multiplication and addition', keywords: ['volume', 'measurement', 'multiplication'] },
        ],
    },

    // Singapore Primary Math
    Singapore_Primary_Math: {
        P1: [
            { id: 'SG.P1.NUM.1', domain: 'Numbers', description: 'Numbers up to 100', keywords: ['counting', 'numbers', 'place value'] },
            { id: 'SG.P1.NUM.2', domain: 'Numbers', description: 'Addition and subtraction within 100', keywords: ['addition', 'subtraction', 'basic operations'] },
            { id: 'SG.P1.MEA.1', domain: 'Measurement', description: 'Length and mass', keywords: ['measurement', 'length', 'mass', 'comparison'] },
        ],
        P2: [
            { id: 'SG.P2.NUM.1', domain: 'Numbers', description: 'Numbers up to 1000', keywords: ['place value', 'thousands'] },
            { id: 'SG.P2.NUM.2', domain: 'Numbers', description: 'Multiplication and division', keywords: ['multiplication', 'division', 'times tables'] },
            { id: 'SG.P2.FRA.1', domain: 'Fractions', description: 'Basic fractions (halves, quarters)', keywords: ['fractions', 'parts', 'whole'] },
        ],
        P3: [
            { id: 'SG.P3.NUM.1', domain: 'Numbers', description: 'Numbers up to 10,000', keywords: ['place value', 'large numbers'] },
            { id: 'SG.P3.FRA.1', domain: 'Fractions', description: 'Equivalent fractions', keywords: ['equivalent fractions', 'simplification'] },
            { id: 'SG.P3.MEA.1', domain: 'Measurement', description: 'Time and money', keywords: ['time', 'money', 'calculation'] },
        ],
        P4: [
            { id: 'SG.P4.NUM.1', domain: 'Numbers', description: 'Numbers up to 100,000', keywords: ['place value', 'rounding'] },
            { id: 'SG.P4.FRA.1', domain: 'Fractions', description: 'Addition and subtraction of fractions', keywords: ['fractions', 'operations'] },
            { id: 'SG.P4.DEC.1', domain: 'Decimals', description: 'Decimals up to 2 decimal places', keywords: ['decimals', 'place value'] },
        ],
        P5: [
            { id: 'SG.P5.FRA.1', domain: 'Fractions', description: 'Multiplication and division of fractions', keywords: ['fractions', 'multiplication', 'division'] },
            { id: 'SG.P5.PER.1', domain: 'Percentage', description: 'Percentage', keywords: ['percentage', 'conversion'] },
            { id: 'SG.P5.RAT.1', domain: 'Ratio', description: 'Basic ratio', keywords: ['ratio', 'proportion'] },
        ],
        P6: [
            { id: 'SG.P6.RAT.1', domain: 'Ratio', description: 'Advanced ratio and proportion', keywords: ['ratio', 'proportion', 'problem solving'] },
            { id: 'SG.P6.ALG.1', domain: 'Algebra', description: 'Simple algebraic expressions', keywords: ['algebra', 'expressions', 'variables'] },
            { id: 'SG.P6.GEO.1', domain: 'Geometry', description: 'Area and perimeter of complex shapes', keywords: ['area', 'perimeter', 'geometry'] },
        ],
    },

    // UK National Curriculum
    UK_National_Math: {
        'Year 1': [
            { id: 'UK.Y1.NUM.1', domain: 'Number', description: 'Count to and across 100', keywords: ['counting', 'numbers'] },
            { id: 'UK.Y1.NUM.2', domain: 'Number', description: 'Addition and subtraction facts to 20', keywords: ['addition', 'subtraction', 'number bonds'] },
        ],
        'Year 2': [
            { id: 'UK.Y2.NUM.1', domain: 'Number', description: 'Recall multiplication and division facts for 2, 5, and 10', keywords: ['multiplication', 'division', 'times tables'] },
            { id: 'UK.Y2.FRA.1', domain: 'Fractions', description: 'Recognize simple fractions', keywords: ['fractions', 'halves', 'quarters', 'thirds'] },
        ],
        'Year 3': [
            { id: 'UK.Y3.NUM.1', domain: 'Number', description: 'Recall multiplication and division facts for 3, 4, and 8', keywords: ['multiplication', 'division', 'times tables'] },
            { id: 'UK.Y3.FRA.1', domain: 'Fractions', description: 'Add and subtract fractions with same denominator', keywords: ['fractions', 'addition', 'subtraction'] },
        ],
    },
};

/**
 * Find curriculum standards by keywords and level
 */
export function findStandards({ curriculum, level, keywords = [] }) {
    const standardsSet = CURRICULUM_STANDARDS[curriculum];
    if (!standardsSet) return [];

    const levelStandards = standardsSet[level];
    if (!levelStandards) return [];

    if (keywords.length === 0) {
        return levelStandards;
    }

    // Filter by keywords
    return levelStandards.filter(standard => {
        const allText = `${standard.description} ${standard.keywords.join(' ')}`.toLowerCase();
        return keywords.some(keyword => allText.includes(keyword.toLowerCase()));
    });
}

/**
 * Auto-align content to curriculum standards
 */
export function autoAlignStandards(content, { curriculum, level }) {
    const keywords = extractKeywords(content);
    return findStandards({ curriculum, level, keywords });
}

/**
 * Extract keywords from content (simple implementation)
 */
function extractKeywords(content) {
    const lowerContent = content.toLowerCase();
    const commonKeywords = [
        'addition', 'subtraction', 'multiplication', 'division',
        'fractions', 'decimals', 'percentage', 'ratio', 'proportion',
        'algebra', 'geometry', 'measurement', 'time', 'money',
        'place value', 'numbers', 'counting', 'area', 'perimeter',
        'volume', 'angles', 'shapes',
    ];

    return commonKeywords.filter(keyword => lowerContent.includes(keyword));
}

/**
 * Generate coverage report
 */
export function generateCoverageReport(assignmentsList, { curriculum, level }) {
    const allStandards = CURRICULUM_STANDARDS[curriculum]?.[level] || [];
    const coveredStandards = new Set();

    assignmentsList.forEach(assignment => {
        if (assignment.curriculumStandards) {
            assignment.curriculumStandards.forEach(std => coveredStandards.add(std));
        }
    });

    const coverage = (coveredStandards.size / allStandards.length) * 100;
    const uncovered = allStandards.filter(std => !coveredStandards.has(std.id));

    return {
        totalStandards: allStandards.length,
        covered: coveredStandards.size,
        coveragePercentage: Math.round(coverage),
        uncoveredStandards: uncovered,
    };
}

/**
 * Get curriculum options
 */
export function getCurriculumOptions() {
    return Object.keys(CURRICULUM_STANDARDS).map(key => ({
        value: key,
        label: key.replace(/_/g, ' '),
    }));
}

/**
 * Get levels for curriculum
 */
export function getLevelsForCurriculum(curriculum) {
    const standardsSet = CURRICULUM_STANDARDS[curriculum];
    if (!standardsSet) return [];

    return Object.keys(standardsSet).map(level => ({
        value: level,
        label: level,
    }));
}
