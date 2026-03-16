export async function askElora(prompt: string): Promise<string> {
  const response = await fetch("/api/gemini-suggest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
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
