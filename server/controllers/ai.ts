import { Request, Response } from 'express';

// ── Types ──────────────────────────────────────────────────────────────────

export interface GameQuestion {
    id: string;
    prompt: string;
    options: string[];
    correctIndex: number;
    difficulty: "easy" | "medium" | "hard";
    topic: string;
    explanation?: string;
}

export interface GamePack {
    id: string;
    title: string;
    topic: string;
    level: string;
    questions: GameQuestion[];
}

export interface GenerateGameRequest {
    topic: string;
    level: string;
    questionCount?: number;
    difficulty?: "easy" | "medium" | "hard" | "mixed";
}

// ── Mock Generator (LLM Ready) ─────────────────────────────────────────────

/**
 * Generates a mock game pack based on deterministic templates.
 * In the future, this function can be replaced with an actual LLM call
 * (e.g. OpenAI, vertex AI) to dynamically generate content.
 */
const generateGamePackFromLLM = async (params: GenerateGameRequest): Promise<GamePack> => {
    const { topic, level, questionCount = 5, difficulty = "mixed" } = params;

    const questions: GameQuestion[] = [];
    const t = topic.toLowerCase();

    // Categorize
    const isMath = ['math', 'algebra', 'fraction', 'geometry', 'calculus', 'addition', 'subtraction', 'number'].some(k => t.includes(k));
    const isScience = ['science', 'solar', 'matter', 'physics', 'chemistry', 'biology', 'gravity', 'planet'].some(k => t.includes(k));

    for (let i = 0; i < questionCount; i++) {
        const qDifficulty = difficulty === "mixed"
            ? (i % 3 === 0 ? "hard" : i % 2 === 0 ? "medium" : "easy")
            : difficulty;

        let prompt = "";
        let options: string[] = [];
        let correctIndex = 0;
        let explanation = "";

        if (isMath) {
            // Seed a realistic math question
            const a = Math.floor(Math.random() * 20) + 2;
            const b = Math.floor(Math.random() * 15) + 2;

            if (i % 3 === 0) {
                // Word problem
                const ans = (a * 10) * b;
                prompt = `If a train travels at ${a * 10} km/h for ${b} hours, what is the total distance covered?`;
                options = [`${ans - 10} km`, `${ans} km`, `${ans + 20} km`, `${ans + 10} km`];
                correctIndex = 1;
                explanation = `Distance is calculated by multiplying speed (${a * 10} km/h) by time (${b} hours), which equals ${ans} km.`;
            } else if (i % 3 === 1) {
                // Equation
                prompt = `Solve for x in the equation: ${a}x - ${b} = ${a * 3 - b}`;
                options = ['1', '2', '3', '4'];
                correctIndex = 2; // ans is 3
                explanation = `Adding ${b} to both sides gives ${a}x = ${a * 3}. Dividing by ${a} leaves x = 3.`;
            } else {
                // Comparison / Fractions
                prompt = `Which fraction is larger: 1/${a} or 1/${b}?`;
                const isALarger = (1 / a) > (1 / b);
                options = [`1/${a}`, `1/${b}`, `They are equal`, `Cannot be determined`];
                correctIndex = isALarger ? 0 : 1;
                explanation = `When two fractions have the same numerator (1), the one with the smaller denominator is the larger fraction.`;
            }
        } else if (isScience) {
            if (i % 3 === 0) {
                prompt = `In the context of ${topic}, which of the following best describes the principle of conservation?`;
                options = [
                    `It can be created and destroyed freely.`,
                    `It changes form but is neither created nor destroyed.`,
                    `It naturally degrades into nothing over time.`,
                    `It increases exponentially in a closed system.`
                ];
                correctIndex = 1;
                explanation = `The principle of conservation states that the total amount remains constant even as it changes from one form to another.`;
            } else if (i % 3 === 1) {
                prompt = `What is a common misconception regarding ${topic}?`;
                options = [
                    `That it is universally applicable across all conditions.`,
                    `That it is affected by standard atmospheric pressure.`,
                    `That it remains constant at absolute zero.`,
                    `That it does not interact with other materials.`
                ];
                correctIndex = 0;
                explanation = `In science, many concepts that seem universal actually only apply within specific boundary conditions or scales.`;
            } else {
                prompt = `Which phenomenon is most directly related to the study of ${topic}?`;
                options = [
                    `Quantum entanglement`,
                    `Thermal expansion`,
                    `Cellular mitosis`,
                    `It depends on the specific environmental variables.`
                ];
                correctIndex = 3;
                explanation = `Many scientific observations in ${topic} are highly dependent on the physical context and external variables of the system.`;
            }
        } else {
            // General Knowledge / Language
            if (i % 2 === 0) {
                prompt = `What is the primary significance of ${topic} when studying ${level} materials?`;
                options = [
                    `It provides a foundational understanding of the core concepts.`,
                    `It is mostly a historical footnote with little modern use.`,
                    `It only applies to advanced, theoretical applications.`,
                    `It is the only correct framework for analyzing the subject.`
                ];
                correctIndex = 0;
                explanation = `${topic} is crucial because it forms the basic building blocks required to understand more complex ${level} topics.`;
            } else {
                prompt = `Which term is most synonymous with the key ideas of ${topic}?`;
                options = [
                    `Fundamental principles`,
                    `Secondary observations`,
                    `Anecdotal evidence`,
                    `Hypothetical approximations`
                ];
                correctIndex = 0;
                explanation = `The key ideas of ${topic} are considered "fundamental principles" because they are the essential underlying truths of the subject.`;
            }
        }

        // Shuffle options to randomize the correct index
        const shuffled = options.map((opt, idx) => ({ opt, isCorrect: idx === correctIndex })).sort(() => Math.random() - 0.5);

        questions.push({
            id: `q_${Date.now()}_${i}`,
            prompt: prompt,
            options: shuffled.map(s => s.opt),
            correctIndex: shuffled.findIndex(s => s.isCorrect),
            difficulty: qDifficulty as "easy" | "medium" | "hard",
            topic,
            explanation
        });
    }

    return {
        id: `pack_${Date.now()}`,
        title: `${topic.charAt(0).toUpperCase() + topic.slice(1)} Challenge`,
        topic,
        level,
        questions
    };
};

// ── Controller ─────────────────────────────────────────────────────────────

export const generateGame = async (req: Request, res: Response): Promise<void> => {
    try {
        const { topic, level, questionCount, difficulty } = req.body as GenerateGameRequest;

        if (!topic || !level) {
            res.status(400).json({ error: 'Fields "topic" and "level" are required.' });
            return;
        }

        const gamePack = await generateGamePackFromLLM({
            topic,
            level,
            questionCount,
            difficulty
        });

        res.status(200).json(gamePack);
    } catch (error: any) {
        console.error('Error in AI generateGame controller:', error);
        res.status(500).json({ error: 'Failed to generate game pack via AI' });
    }
};
