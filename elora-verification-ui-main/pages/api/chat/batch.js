// pages/api/chat/batch.js
// Batch processing for multiple AI questions

import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://elora.app',
    },
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { questions, context = {} } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'Questions array is required' });
    }

    if (questions.length > 10) {
        return res.status(400).json({ error: 'Maximum 10 questions per batch' });
    }

    try {
        // Process questions in parallel
        const responses = await Promise.all(
            questions.map(async (question, index) => {
                try {
                    const systemPrompt = buildSystemPrompt(context);

                    const completion = await openai.chat.completions.create({
                        model: 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: question },
                        ],
                        temperature: 0.7,
                        max_tokens: 500,
                    });

                    return {
                        question,
                        answer: completion.choices[0].message.content,
                        index,
                        success: true,
                    };
                } catch (error) {
                    console.error(`Error processing question ${index}:`, error);
                    return {
                        question,
                        answer: null,
                        error: 'Failed to process this question',
                        index,
                        success: false,
                    };
                }
            })
        );

        res.status(200).json({ responses });
    } catch (error) {
        console.error('Batch processing error:', error);
        res.status(500).json({ error: 'Failed to process batch' });
    }
}

function buildSystemPrompt(context) {
    let prompt = 'You are Elora, an educational AI assistant.';

    if (context.role === 'student') {
        prompt += ' You are helping a student learn. Be encouraging and guide them to discover answers rather than just giving them.';
    } else if (context.role === 'educator') {
        prompt += ' You are assisting a teacher. Provide professional, curriculum-aligned responses.';
    } else if (context.role === 'parent') {
        prompt += ' You are helping a parent understand educational concepts. Explain clearly without jargon.';
    }

    if (context.level) {
        prompt += ` The student is in grade ${context.level}.`;
    }

    if (context.subject) {
        prompt += ` Focus on ${context.subject}.`;
    }

    if (context.personality === 'strict') {
        prompt += ' Be direct and academically rigorous. Focus on accuracy and proper methodology.';
    } else if (context.personality === 'encouraging') {
        prompt += ' Be warm, supportive, and celebrate progress. Build confidence.';
    } else if (context.personality === 'socratic') {
        prompt += ' Use the Socratic method: ask guiding questions to help the student discover answers themselves.';
    }

    return prompt;
}
