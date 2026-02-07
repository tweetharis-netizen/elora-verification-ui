// pages/api/rubric/generate.js
// AI-powered rubric generation

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

    const { title, description, points, level } = req.body;

    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
    }

    try {
        const prompt = `Create a detailed grading rubric for the following assignment:

Title: ${title}
Description: ${description}
Total Points: ${points || 100}
${level ? `Grade Level: ${level}` : ''}

Generate a rubric with 3-4 criteria. For each criterion:
1. Name the criterion
2. Provide a brief description
3. Assign a weight (total should be 100%)
4. Create 4 performance levels: Excellent (4 pts), Good (3 pts), Satisfactory (2 pts), Needs Improvement (1 pt)
5. For each level, provide specific descriptors

Return the rubric in this exact JSON format:
{
  "criteria": [
    {
      "name": "Criterion Name",
      "description": "What this evaluates",
      "weight": 25,
      "levels": [
        {"name": "Excellent", "points": 4, "description": "Specific descriptor"},
        {"name": "Good", "points": 3, "description": "Specific descriptor"},
        {"name": "Satisfactory", "points": 2, "description": "Specific descriptor"},
        {"name": "Needs Improvement", "points": 1, "description": "Specific descriptor"}
      ]
    }
  ]
}`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert educator creating assessment rubrics. Return only valid JSON, no additional text.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' },
        });

        const rubricText = completion.choices[0].message.content;
        const rubric = JSON.parse(rubricText);

        // Add unique IDs to criteria
        rubric.criteria = rubric.criteria.map((criterion, idx) => ({
            ...criterion,
            id: Date.now() + idx,
        }));

        res.status(200).json({ rubric });
    } catch (error) {
        console.error('Rubric generation error:', error);
        res.status(500).json({ error: 'Failed to generate rubric' });
    }
}
