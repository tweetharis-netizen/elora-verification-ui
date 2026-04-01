export interface AskEloraOptions {
  message: string;
  role: 'teacher' | 'student' | 'parent';
  context?: string;
}

export async function askElora({ message, role, context }: AskEloraOptions): Promise<string> {
  const response = await fetch("/api/ai/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt: message, role, context }),
  });

  if (!response.ok) {
    let errorMessage = `Failed to get suggestion from Elora. Status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      // Ignore JSON parse error on error response
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  // The backend now returns { text: "..." } from Groq
  return data.text ?? "No suggestion generated.";
}
