import express, { Request, Response } from 'express';

const router = express.Router();

router.post('/gemini-suggest', async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'A valid "prompt" string is required in the request body.' });
    }

    // Using v1beta as it frequently supports a wider range of models and resolves 404 issues seen with v1 for some models.
    const model = 'gemini-1.5-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log(`[Gemini] Calling API for model: ${model}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini API Error details:", JSON.stringify(errorData, null, 2));
      return res.status(response.status).json({ 
        error: 'Failed to communicate with Gemini API.', 
        details: errorData 
      });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return res.status(500).json({ error: 'An unexpected error occurred while communicating with Gemini API.' });
  }
});

export default router;

/**
 * INTERNAL TEST HELPER
 * This function can be used to manually verify the Gemini integration.
 * It is called once when this module is loaded in non-production environments.
 */
const runInternalTest = async () => {
  if (process.env.NODE_ENV === 'production' || process.env.SKIP_GEMINI_TEST === 'true') return;
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ [Gemini Test] SKIP: GEMINI_API_KEY not found in process.env');
    return;
  }

  const testPrompt = "Hello Gemini, this is an automated integration test. Please respond with 'Integration Test Successful'.";
  const model = 'gemini-1.5-flash';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  console.log(`🚀 [Gemini Test] Running internal integration test for model: ${model}...`);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: testPrompt }] }]
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('✅ [Gemini Test] SUCCESS! Response:', text?.trim());
    } else {
      const error = await response.json().catch(() => ({}));
      console.error(`❌ [Gemini Test] FAILED with status ${response.status}:`, JSON.stringify(error, null, 2));
    }
  } catch (err) {
    console.error('❌ [Gemini Test] CRITICAL ERROR:', err);
  }
};

// Execute test helper on load (only in dev)
runInternalTest();
