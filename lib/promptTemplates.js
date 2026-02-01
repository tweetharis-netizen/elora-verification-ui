// lib/promptTemplates.js
// Saved prompt templates for teachers and response libraries

export const PROMPT_TEMPLATES = {
    // Explanation templates
    explain_concept: {
        id: 'explain_concept',
        category: 'teaching',
        name: 'Explain a Concept',
        description: 'Classroom-ready explanation with examples',
        template: {
            systemPrompt: 'You are an expert educator. Provide a clear, concise explanation suitable for {level} students studying {subject}.',
            userPrompt: 'Explain {concept} in a way that {level} students can understand. Include one concrete example and a quick check question.',
            variables: ['level', 'subject', 'concept'],
        },
    },

    lesson_plan: {
        id: 'lesson_plan',
        category: 'planning',
        name: 'Generate Lesson Plan',
        description: 'Complete lesson plan with objectives, activities, and assessment',
        template: {
            systemPrompt: 'You are an experienced curriculum designer creating lesson plans for {level} {subject}.',
            userPrompt: 'Create a {duration}-minute lesson plan on {topic}. Include:\n- Learning objectives\n- Materials needed\n- Step-by-step activities with timings\n- Formative assessment\n- Differentiation strategies for mixed abilities',
            variables: ['level', 'subject', 'topic', 'duration'],
        },
    },

    differentiation: {
        id: 'differentiation',
        category: 'teaching',
        name: 'Differentiation Suggestions',
        description: 'Quick adaptations for different ability levels',
        template: {
            systemPrompt: 'You are a special education specialist helping teachers differentiate instruction.',
            userPrompt: 'I\'m teaching {topic} to {level} students. Provide 3 quick differentiation strategies:\n1. For struggling students\n2. For on-level students\n3. For advanced students',
            variables: ['topic', 'level'],
        },
    },

    assessment_creation: {
        id: 'assessment_creation',
        category: 'assessment',
        name: 'Create Assessment',
        description: 'Formative or summative assessment with rubric',
        template: {
            systemPrompt: 'You are an assessment expert creating age-appropriate {assessment_type} assessments.',
            userPrompt: 'Create a {assessment_type} assessment for {topic} ({level}). Include:\n- {num_questions} questions of varying difficulty\n- Clear rubric with criteria\n- Estimated completion time',
            variables: ['assessment_type', 'topic', 'level', 'num_questions'],
        },
    },

    parent_communication: {
        id: 'parent_communication',
        category: 'communication',
        name: 'Parent Communication',
        description: 'Professional parent communication templates',
        template: {
            systemPrompt: 'You are a tactful teacher drafting parent communication.',
            userPrompt: 'Draft a {tone} message to parents about {situation}. Keep it professional, specific, and solution-focused. Include actionable next steps.',
            variables: ['tone', 'situation'],
        },
    },

    // Student templates
    homework_help: {
        id: 'homework_help',
        category: 'learning',
        name: 'Homework Help',
        description: 'Guided help without giving answers',
        template: {
            systemPrompt: 'You are a patient tutor helping a {level} student. Guide them to the answer without solving it for them. Use the Socratic method.',
            userPrompt: 'I\'m stuck on: {problem}. Can you help me understand how to solve this?',
            variables: ['level', 'problem'],
        },
    },

    concept_breakdown: {
        id: 'concept_breakdown',
        category: 'learning',
        name: 'Break Down Concept',
        description: 'ELI5 style explanation',
        template: {
            systemPrompt: 'You are an expert at making complex topics simple. Explain like the student is 5 years old (but adjust for their actual level: {level}).',
            userPrompt: 'Can you explain {concept} in the simplest way possible? Use analogies and everyday examples.',
            variables: ['level', 'concept'],
        },
    },

    study_plan: {
        id: 'study_plan',
        category: 'learning',
        name: 'Create Study Plan',
        description: 'Personalized study schedule',
        template: {
            systemPrompt: 'You are a study skills coach creating realistic, achievable study plans.',
            userPrompt: 'I need to learn {topic} before {deadline}. I have {available_hours} hours per week. Create a week-by-week study plan with specific daily goals.',
            variables: ['topic', 'deadline', 'available_hours'],
        },
    },

    // Parent templates
    progress_check: {
        id: 'progress_check',
        category: 'parent',
        name: 'Understand Progress',
        description: 'Explain child\'s progress in plain language',
        template: {
            systemPrompt: 'You are explaining educational concepts to parents without jargon. Be clear and reassuring.',
            userPrompt: 'My child is learning about {topic} in {subject}. What should I know about this? How can I help at home?',
            variables: ['topic', 'subject'],
        },
    },

    conversation_starters: {
        id: 'conversation_starters',
        category: 'parent',
        name: 'Conversation Starters',
        description: 'Questions to ask your child about school',
        template: {
            systemPrompt: 'You are a family engagement specialist helping parents connect with their children about learning.',
            userPrompt: 'Give me 5 specific questions I can ask my {level} child about their {subject} class today. Make them open-ended and engaging.',
            variables: ['level', 'subject'],
        },
    },
};

/**
 * Apply template with variables
 */
export function applyPromptTemplate(templateId, variables = {}) {
    const template = PROMPT_TEMPLATES[templateId];
    if (!template) return null;

    let systemPrompt = template.template.systemPrompt;
    let userPrompt = template.template.userPrompt;

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        systemPrompt = systemPrompt.replace(regex, value);
        userPrompt = userPrompt.replace(regex, value);
    });

    return {
        systemPrompt,
        userPrompt,
        originalTemplate: template,
    };
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category) {
    return Object.values(PROMPT_TEMPLATES).filter(t => t.category === category);
}

/**
 * Get templates by role
 */
export function getTemplatesByRole(role) {
    const roleCategories = {
        educator: ['teaching', 'planning', 'assessment', 'communication'],
        student: ['learning'],
        parent: ['parent'],
    };

    const categories = roleCategories[role] || [];
    return Object.values(PROMPT_TEMPLATES).filter(t => categories.includes(t.category));
}

/**
 * Response library for common questions
 */
export const RESPONSE_LIBRARY = {
    // Math
    'what is a fraction': {
        tags: ['math', 'fractions', 'elementary'],
        response: 'A fraction represents a part of a whole. The top number (numerator) tells you how many parts you have, and the bottom number (denominator) tells you how many equal parts the whole is divided into. For example, if you cut a pizza into 8 slices and eat 3, you\'ve eaten 3/8 of the pizza.',
    },

    'how do I multiply fractions': {
        tags: ['math', 'fractions', 'operations'],
        response: 'To multiply fractions: 1) Multiply the top numbers (numerators) together, 2) Multiply the bottom numbers (denominators) together, 3) Simplify if possible. Example: 1/2 × 3/4 = (1×3)/(2×4) = 3/8',
    },

    // Science
    'what is photosynthesis': {
        tags: ['science', 'biology', 'plants'],
        response: 'Photosynthesis is how plants make their own food using sunlight, water, and carbon dioxide. The green pigment chlorophyll in leaves captures sunlight, and the plant uses this energy to convert water and CO2 into glucose (sugar) and oxygen. The formula is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2',
    },

    // General study skills
    'how do I study effectively': {
        tags: ['study_skills', 'general'],
        response: 'Effective studying includes: 1) Break study time into focused 25-30 minute sessions with breaks, 2) Practice active recall by testing yourself, 3) Space out your studying over days/weeks rather than cramming, 4) Teach the concept to someone else, 5) Use multiple methods (reading, writing, diagrams, practice problems)',
    },
};

/**
 * Find response in library
 */
export function findResponse(query) {
    const lowerQuery = query.toLowerCase().trim();

    // Exact match
    if (RESPONSE_LIBRARY[lowerQuery]) {
        return RESPONSE_LIBRARY[lowerQuery];
    }

    // Fuzzy match
    const entries = Object.entries(RESPONSE_LIBRARY);
    for (const [key, value] of entries) {
        if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
            return value;
        }
    }

    return null;
}
