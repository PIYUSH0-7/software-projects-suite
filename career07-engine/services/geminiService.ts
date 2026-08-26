import { GoogleGenAI } from "@google/genai";

export const explainConcept = async (concept: string, context: string): Promise<string> => {
  // Check for API key inside the function to avoid top-level crash on app load
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return "The AI Tutor is currently offline because no API Key was detected. \n\nTo enable AI features, please set up your API Key in the environment variables. \n\nDon't worry—the rest of your dashboard, roadmap, and tracking tools work perfectly without it!";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      You are an expert technical tutor for a student learning software engineering.
      The student is asking about: "${concept}".
      The context of their learning path is: "${context}".
      
      Please provide a concise, clear, and beginner-friendly explanation (max 150 words). 
      If applicable, provide a very short code snippet in the relevant language (Python for DSA, JS/TS for Web/Mobile).
      Focus on the "Why" and "How".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "I couldn't generate an explanation at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to the AI Tutor. Please check your internet connection or API quota.";
  }
};