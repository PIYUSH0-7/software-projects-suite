
import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing from environment variables.");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const rewriteEntry = async (rawText: string): Promise<string> => {
  if (!rawText.trim()) return "";
  
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Rewrite the following daily developer log entry to be professional, concise, action-oriented, and grammatically correct. Do not add conversational filler. Just return the polished text. 
      
      Entry: "${rawText}"`,
    });
    
    return response.text || rawText;
  } catch (error) {
    console.error("Error rewriting entry:", error);
    return rawText; // Fallback to original
  }
};

export const generateWeeklySummary = async (days: string[], courseTitle: string, weekNum: number): Promise<string> => {
  const validDays = days.filter(d => d.trim().length > 0);
  if (validDays.length === 0) return "No entries found for this week to summarize.";

  try {
    const ai = getAiClient();
    const prompt = `Write a viral, high-impact LinkedIn post summarizing my weekly progress in the "${courseTitle}" course (Week ${weekNum}).
    
    Logs:
    ${validDays.map((d, i) => `Day ${i + 1}: ${d}`).join('\n')}

    Requirements:
    - Structure: Hook -> Key Achievement/Insight -> Technical Detail -> Call to Action/Question.
    - Style: Professional, energetic, authentic. No "excited to share" cliches.
    - Formatting: Use line breaks for readability. Use bullet points for lists.
    - Length: Under 150 words.
    - Hashtags: 3-5 relevant tags at the end.
    - Output: JUST the post text. No preamble.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Error generating summary. Please try again.";
  }
};

export const generateMonthlyBlog = async (weeksData: {weekNum: number, summary: string}[], courseTitle: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const content = weeksData.map(w => `Week ${w.weekNum} Summary: ${w.summary}`).join('\n\n');
    const prompt = `Write a comprehensive technical blog post summarizing my progress in ${courseTitle} over the last month.
    
    Input Data:
    ${content}

    Requirements:
    - Format: Markdown (.md)
    - Title: Engaging and specific.
    - Structure: 
      1. Introduction (The Goal)
      2. The Monthly Grind (Synthesize the weekly challenges and wins)
      3. Key Technical Concepts Mastered
      4. What's Next
    - Tone: Professional developer sharing their journey.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    return "Error generating blog.";
  }
};

export const generateSkillGapAnalysis = async (allSummaries: string[], courseTitle: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const prompt = `Act as a friendly Senior Engineer Mentor. Review my progress logs for ${courseTitle} and provide a Skill Gap Analysis.
    
    Logs:
    ${allSummaries.join('\n')}

    Output Format (Very easy-to-read, student-friendly):
    
    ### 🌟 Strengths
    (2-3 bullet points on what I'm doing well)

    ### ⚠️ Skill Gaps
    (2 specific concepts I need to practice more)

    ### 📅 Action Plan
    (1 specific, actionable task for next week)

    Keep the tone encouraging but actionable.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    return "Error generating analysis.";
  }
};
