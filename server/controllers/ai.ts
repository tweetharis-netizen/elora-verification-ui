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

export const getSystemPrompt = (role: 'teacher' | 'student' | 'parent'): string => {
  const commonInstructions = "Use short, clear paragraphs. Sound calm and encouraging. Avoid over-apologising and don't mention internal tools or logs.";
  
  if (role === 'teacher') {
    return `You are Elora, a calm, supportive assistant for a teacher. Help them reduce admin noise and support students. Use a warm, professional tone, and always suggest one concrete next step they can take. ${commonInstructions}`;
  }
  if (role === 'student') {
    return `You are Elora, a calm study companion for a student. Help them see what's coming up, break work into smaller steps, and explain tricky topics in simple language. ${commonInstructions}`;
  }
  if (role === 'parent') {
    return `You are Elora, a clear, non-judgmental assistant for a parent. Help them understand their child's school life, summarize progress, and suggest ways to support learning at home. Use a warm tone and simple language. ${commonInstructions}`;
  }
  return `You are Elora, a helpful assistant. ${commonInstructions}`;
};

export const askEloraHandler = async (req: Request, res: Response): Promise<void> => {
  const { prompt, role, context } = req.body;
  const userRole = (role as 'teacher' | 'student' | 'parent') || 'teacher';

  try {
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'A valid "prompt" string is required in the request body.' });
      return;
    }
    
    const message = prompt.trim().toLowerCase();
    
    // ── Greeting Shortcut (ALL roles) ─────────────────────────────────────────
    const isGreeting = message === 'hi' || message === 'hello' || message === 'hey' || message === 'hi elora' || message === 'hello elora' || (message.split(' ').length < 5 && (message.includes('hi') || message.includes('hello') || message.includes('hey')));
    
    if (isGreeting) {
      let text = "Hello! I am Elora. How can I assist you today?";
      if (userRole === 'teacher') {
        text = "Hello! I’m Elora. I’m here to help you manage your classes, reduce admin work, and support your students. What can I do for you today?";
      } else if (userRole === 'student') {
        text = "Hey! I’m Elora. I can help you see what’s coming up, revise tricky topics, or plan your study time. What would you like to work on?";
      } else if (userRole === 'parent') {
        text = "Hi! I’m Elora. I can help you understand how your child is doing and what might help them next. What are you curious about?";
      }
      res.json({ text });
      return;
    }

    // ── Capabilities Shortcut (ALL roles) ─────────────────────────────────────
    const isWhatCanYouDo = message.includes('what can you do') || message === 'help' || message === 'help me' || message.includes('how can you help');
    
    if (isWhatCanYouDo) {
      let text = "I am a helpful assistant.";
      if (userRole === 'teacher') {
        text = "Here are a few things I can help with:\n• Summarise which students need attention this week.\n• Draft gentle nudges to students or parents.\n• Help you plan a lesson or quiz.\n• Explain what’s happening in your class data in plain language.";
      } else if (userRole === 'student') {
        text = "I can:\n• Show you what’s due next.\n• Help you break study into small steps.\n• Explain topics you’re stuck on in simple language.";
      } else if (userRole === 'parent') {
        text = "I can:\n• Give you a simple overview of how your child is doing.\n• Suggest questions to ask their teacher.\n• Help you understand upcoming work and how to support at home.";
      }
      res.json({ text });
      return;
    }

    // ── Identity Shortcut (ALL roles) ─────────────────────────────────────────
    const isIdentity = message.includes('who are you') || message.includes('what are you') || message.includes('are you elora') || message.includes('who is elora');
    
    if (isIdentity) {
      let text = "I am Elora, your AI assistant.";
      if (userRole === 'teacher') {
        text = "I’m Elora, your AI teaching assistant. I help you keep track of which students need attention, plan lessons, and reduce admin noise so you can focus on mentoring.";
      } else if (userRole === 'student') {
        text = "I’m Elora, your study companion. I help you see what’s coming up, break work into smaller steps, and explain tricky topics in simple language.";
      } else if (userRole === 'parent') {
        text = "I’m Elora, your assistant for understanding your child’s school life. I can summarise how they’re doing, highlight what’s coming up, and suggest ways you can support them at home.";
      }
      res.json({ text });
      return;
    }

    // ── Real AI Call ────────────────────────────────────────────────────────
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'LLM API service is not configured on the server.' });
      return;
    }

    const model = 'llama-3.3-70b-versatile';
    const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

    const baseSystemPrompt = getSystemPrompt(userRole);
    let finalSystemPrompt = baseSystemPrompt;
    if (context) {
      finalSystemPrompt += `\n\nContext about this teacher's current class (do not repeat this verbatim, just use it to inform your answer): ${context}`;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: finalSystemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq API Error details:", JSON.stringify(errorData, null, 2));
      
      // Role-specific fallback for errors
      let errorFallback = "I’m having a bit of trouble connecting right now. While I find my way back, feel free to check your main dashboard insights.";
      if (userRole === 'teacher') {
        errorFallback = "I’m having a bit of trouble connecting right now. While that loads, you can still see which students need attention in your dashboard. Want to check your ‘Needs attention’ panel?";
      } else if (userRole === 'student') {
        errorFallback = "I’m having a little trouble thinking right now. While I reset, you can open your dashboard to see what’s due next, or ask me about a specific subject or deadline.";
      } else if (userRole === 'parent') {
        errorFallback = "I’m having some trouble connecting at the moment. You can still see a quick overview in your parent dashboard, or ask me a simpler question about Jordan’s progress.";
      }
      
      res.json({ text: errorFallback });
      return;
    }

    const data = await response.json();
    let finalOutput = data.choices?.[0]?.message?.content || "";

    // ── Fallback for empty/invalid responses ──────────────────────────────────
    if (!finalOutput || finalOutput.trim().length === 0) {
      if (userRole === 'teacher') {
        finalOutput = "I’m having a bit of trouble connecting right now. While that loads, you can still see which students need attention in your dashboard. Want to check your ‘Needs attention’ panel?";
      } else if (userRole === 'student') {
        finalOutput = "I’m having a little trouble thinking right now. While I reset, you can open your dashboard to see what’s due next, or ask me about a specific subject or deadline.";
      } else if (userRole === 'parent') {
        finalOutput = "I’m having some trouble connecting at the moment. You can still see a quick overview in your parent dashboard, or ask me a simpler question about Jordan’s progress.";
      } else {
        finalOutput = "I’m having a bit of trouble connecting right now. I'll be back shortly!";
      }
    }

    if (finalOutput.length > 800) {
      finalOutput = finalOutput.substring(0, 800) + '...';
    }
    
    res.json({ text: finalOutput });
  } catch (error) {
    console.error('Error in askEloraHandler:', error);
    let catchFallback = "I encountered an unexpected error. Please try again later.";
    if (userRole === 'teacher') {
      catchFallback = "I’m having a bit of trouble connecting right now. While that loads, you can still see which students need attention in your dashboard. Want to check your ‘Needs attention’ panel?";
    } else if (userRole === 'student') {
      catchFallback = "I’m having a little trouble thinking right now. While I reset, you can open your dashboard to see what’s due next, or ask me about a specific subject or deadline.";
    } else if (userRole === 'parent') {
      catchFallback = "I’m having some trouble connecting at the moment. You can still see a quick overview in your parent dashboard, or ask me a simpler question about Jordan’s progress.";
    }
    res.json({ text: catchFallback });
  }
};
