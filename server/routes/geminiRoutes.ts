import express, { Request, Response } from 'express';

const router = express.Router();

router.post('/gemini-suggest', async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' });
    }

    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'A valid "prompt" string is required in the request body.' });
    }

    // Using Groq instead of Gemini
    const model = 'llama-3.3-70b-versatile';
    const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

    console.log(`[Groq] Calling API for model: ${model}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: "You are Elora, a concise teaching assistant for teachers.\nAlways respond in very short form: 2–3 sentences or up to 5 short bullet points.\nPrefer concrete, practical suggestions over long explanations.\nYou must also understand direct instruction-style commands from teachers (like assigning work to specific students/classes) and turn them into clear, short, actionable suggestions written to the teacher."
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq API Error details:", JSON.stringify(errorData, null, 2));
      return res.status(response.status).json({ 
        error: 'Failed to communicate with Groq API.', 
        details: errorData 
      });
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || "";
    
    let finalOutput = generatedText;
    if (finalOutput.length > 800) {
      finalOutput = finalOutput.substring(0, 800) + '...';
    }
    
    // Return in a simple consolidated format for the frontend
    return res.json({ text: finalOutput });
  } catch (error) {
    console.error('Error calling Groq API:', error);
    return res.status(500).json({ error: 'An unexpected error occurred while communicating with Groq API.' });
  }
});

export default router;

/**
 * INTERNAL TEST HELPER
 * This function can be used to manually verify the Groq integration.
 */
const runInternalTest = async () => {
  if (process.env.NODE_ENV === 'production' || process.env.SKIP_GROQ_TEST === 'true') return;
  
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ [Groq Test] SKIP: GROQ_API_KEY not found in process.env');
    return;
  }

  const testPrompt = "Hello Groq, this is an automated integration test. Please respond with 'Integration Test Successful'.";
  const model = 'llama-3.3-70b-versatile';
  const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

  console.log(`🚀 [Groq Test] Running internal integration test for model: ${model}...`);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: testPrompt }]
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      console.log('✅ [Groq Test] SUCCESS! Response:', text?.trim());
    } else {
      const error = await response.json().catch(() => ({}));
      console.error(`❌ [Groq Test] FAILED with status ${response.status}:`, JSON.stringify(error, null, 2));
    }
  } catch (err) {
    console.error('❌ [Groq Test] CRITICAL ERROR:', err);
  }
};

// Execute test helper on load (only in dev)
runInternalTest();
