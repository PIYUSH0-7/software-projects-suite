
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { UserProfile, Message } from "../types";

export class KrishnaService {
  private ai: GoogleGenAI;
  private modelName = 'gemini-3-flash-preview';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async getResponse(userProfile: UserProfile, history: Message[], currentMessage: string) {
    const formattedHistory = history.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const timetableStr = userProfile.timetable
      .map(t => `- ${t.time}: ${t.activity}`)
      .join('\n');

    const prompt = `
User Name: ${userProfile.name}
Timetable:
${timetableStr}

Input: ${currentMessage}

Instruction: Be brief. Use points. Act as Krishna guiding Arjuna.
`;

    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: [
        ...formattedHistory,
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.9,
      }
    });

    return response.text || "Act now, Arjuna.";
  }

  async *streamResponse(userProfile: UserProfile, history: Message[], currentMessage: string) {
    const formattedHistory = history.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const timetableStr = userProfile.timetable
      .map(t => `- ${t.time}: ${t.activity}`)
      .join('\n');

    const prompt = `
User: ${userProfile.name}
Timetable:
${timetableStr}

Input: ${currentMessage}

Instruction: Extremely concise, point-to-point guidance.
`;

    const result = await this.ai.models.generateContentStream({
      model: this.modelName,
      contents: [
        ...formattedHistory,
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    for await (const chunk of result) {
      yield chunk.text || "";
    }
  }

  async summarizeDay(messages: Message[]): Promise<string> {
    if (messages.length === 0) return "";
    
    const convo = messages.map(m => `${m.role}: ${m.text}`).join('\n');
    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: `Summarize this interaction into one very short Sutra (max 10 words):\n\n${convo}`,
      config: {
        systemInstruction: "You are a divine scribe. Provide a 1-sentence spiritual summary.",
      }
    });
    
    return response.text?.trim() || "Path of duty followed.";
  }
}

export const krishnaService = new KrishnaService();
