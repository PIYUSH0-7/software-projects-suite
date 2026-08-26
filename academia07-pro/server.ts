import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Helper to get Gemini client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined. Please configure it in your Settings > Secrets.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: "15mb" }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Academia07 Pro Lecture Processing Server running!" });
  });

  // Process Lecture Audio/Transcript
  app.post("/api/lecture/process", async (req, res) => {
    try {
      const { transcript, title, subject, style = "comprehensive" } = req.body;

      if (!transcript || typeof transcript !== "string") {
        return res.status(400).json({ error: "No transcript content provided." });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are an expert academic tutor that converts rough, unformatted, stutter-filled speech recognition transcripts from recorded lectures into structured, clear, and highly organized study notes.
Your output must be returned strictly as a single JSON object.
Do not wrap it in markdown block characters (no \`\`\`json).
Remove verbal stutters, repetitions, filler words ("um", "ah", "like"), and speech-to-text spelling errors while keeping 100% of the academic facts, theories, definitions, code snippets, and formulas.

Structure the material according to the requested student learning style:
- "comprehensive": structured notes with complete detail, formulas, explanations, and bullet points.
- "simplified": "Explain Like I'm 5" (ELI5) approach using simple language, high-level summaries, analogies, and straightforward explanations.
- "formulas": focus heavily on key mathematical models, definitions, derivations, formulas, and technical code blocks.
- "exam-prep": focus on potential sessional or university exam questions, mock answers, step-by-step problem-solving, and study suggestions.`;

      const styleGuide = {
        comprehensive: "Generate very thorough notes, detailing all explanations, background concepts, definitions, and academic context.",
        simplified: "Break down complex topics into incredibly simple concepts with real-world analogies. Use friendly, accessible language.",
        formulas: "Extract and explain every equation, formula, technical term, or coding construct. Detail derivations and provide clean syntax blocks.",
        "exam-prep": "Format explanations around potential exam questions, highlighting mark-fetching keywords, sessional tips, and scoring guides."
      }[style as "comprehensive" | "simplified" | "formulas" | "exam-prep"] || "comprehensive";

      const prompt = `LECTURE INFO:
Title: ${title || "Untitled Lecture"}
Subject/Topic: ${subject || "General Engineering"}
Student Selected Style: ${style} (${styleGuide})

RAW SPEECH TRANSCRIPT:
${transcript}

Task: Convert the above raw transcript into highly structured notes in pure JSON format according to the provided schema. Ensure you generate comprehensive explanations and structured quiz questions.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cleanTranscript: { type: Type.STRING, description: "Polished, grammatically correct transcript without stutters or conversational noise." },
              summary: { type: Type.STRING, description: "A high-level 1-2 paragraph executive summary of the lecture." },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Section title/concept name" },
                    content: { type: Type.STRING, description: "Detailed, full paragraph explanation of the topic" },
                    bulletPoints: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING, description: "Key bullets, facts, examples, or equations for this section" }
                    }
                  },
                  required: ["title", "content", "bulletPoints"]
                }
              },
              mindmap: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING, description: "Main concept or cluster header" },
                    subtopics: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING, description: "Branches or subordinate ideas belonging to the main concept" }
                    }
                  },
                  required: ["topic", "subtopics"]
                }
              },
              flashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    front: { type: Type.STRING, description: "Quiz card front (e.g. term, formula name, or core question)" },
                    back: { type: Type.STRING, description: "Quiz card back (e.g. definition, equation, or short explanation)" }
                  },
                  required: ["front", "back"]
                }
              },
              quiz: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: "Multiple-choice question text based on this lecture" },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Exactly 4 options"
                    },
                    correctAnswerIndex: { type: Type.INTEGER, description: "0-based index of correct option" },
                    explanation: { type: Type.STRING, description: "Detailed explanation of why this answer is correct" }
                  },
                  required: ["question", "options", "correctAnswerIndex", "explanation"]
                }
              },
              actionItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING, description: "Recommended study tasks, homework, key concepts to memorize, or practice exercises" }
              }
            },
            required: ["cleanTranscript", "summary", "sections", "mindmap", "flashcards", "quiz", "actionItems"]
          }
        }
      });

      const outputText = response.text;
      if (!outputText) {
        throw new Error("No response returned from the AI model.");
      }

      const processedData = JSON.parse(outputText.trim());
      return res.json({ success: true, processedData });
    } catch (error: any) {
      console.error("Error processing lecture notes:", error);
      return res.status(500).json({ error: error.message || "An error occurred during lecture AI notes processing." });
    }
  });

  // Chat with Lecture (Interactive Q&A)
  app.post("/api/lecture/chat", async (req, res) => {
    try {
      const { transcript, messages } = req.body;

      if (!transcript) {
        return res.status(400).json({ error: "No lecture transcript context provided for chat." });
      }

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages array format." });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are a helpful, expert academic teaching assistant for a university class.
The user is a student asking questions about a specific recorded lecture.
You MUST answer questions strictly and accurately based on the lecture's provided transcript.
If the answer is not mentioned in the transcript, explain that it wasn't mentioned but briefly answer using standard academic knowledge to help the student learn.
Keep your answers clear, professional, academic, and direct. Use markdown, latex equations, and bullet points where helpful.`;

      // Convert messages to Gemini API format
      const geminiHistory = messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));

      // Insert context
      const contents = [
        {
          role: "user",
          parts: [{ text: `Here is the lecture transcript that our discussion will be based on:\n\n=== LECTURE TRANSCRIPT ===\n${transcript}\n=== END LECTURE TRANSCRIPT ===` }]
        },
        {
          role: "model",
          parts: [{ text: "Understood. I have read and digested the lecture transcript. I am ready to answer any questions or help you study the material. What would you like to know?" }]
        },
        ...geminiHistory
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction,
        }
      });

      const reply = response.text || "I was unable to formulate a response.";
      return res.json({ success: true, reply });
    } catch (error: any) {
      console.error("Error in lecture tutor chat:", error);
      return res.status(500).json({ error: error.message || "An error occurred during interactive chat." });
    }
  });

  // Comprehensive Personalized RAG Academic Advisor & Study Coach
  app.post("/api/rag/chat", async (req, res) => {
    try {
      const { messages, studentProfile, selectedSources, contextData } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages history format." });
      }

      const ai = getGeminiClient();

      // Build context block from various retrieved sources based on student performance & academic data
      let contextPayload = "=== STUDENT PROFILE ===\n";
      if (studentProfile) {
        contextPayload += `Name: ${studentProfile.displayName || "Student"}\n`;
        contextPayload += `Email: ${studentProfile.email || "N/A"}\n`;
        contextPayload += `Branch/Major: ${studentProfile.branch || "N/A"}\n`;
        contextPayload += `Current Semester: Semester ${studentProfile.currentSemester || "N/A"}\n`;
        if (studentProfile.skills && studentProfile.skills.length > 0) {
          contextPayload += `Skills/Interests: ${studentProfile.skills.join(", ")}\n`;
        }
        if (studentProfile.bio) {
          contextPayload += `Academic Bio/Goals: ${studentProfile.bio}\n`;
        }
      } else {
        contextPayload += "Profile details not loaded yet.\n";
      }

      if (contextData) {
        // Attendance Data
        if (selectedSources?.attendance && contextData.attendance) {
          contextPayload += "\n=== ATTENDANCE RECORDS ===\n";
          contextPayload += `Overall Attendance: ${contextData.attendance.overallPercentage || "N/A"}%\n`;
          contextPayload += `Status/Warning: ${contextData.attendance.statusMessage || "N/A"}\n`;
          if (contextData.attendance.records && contextData.attendance.records.length > 0) {
            contextPayload += "Recent logs:\n";
            contextData.attendance.records.forEach((r: any) => {
              contextPayload += `- ${r.date}: ${r.subjectName} (${r.subjectCode}) -> ${r.status}\n`;
            });
          } else {
            contextPayload += "No specific attendance logs registered in database yet.\n";
          }
        }

        // Internal Marks (Sessional / Exam performance)
        if (selectedSources?.internalMarks && contextData.internalMarks) {
          contextPayload += "\n=== INTERNAL/SESSIONAL MARKS ===\n";
          if (contextData.internalMarks.records && contextData.internalMarks.records.length > 0) {
            contextData.internalMarks.records.forEach((r: any) => {
              contextPayload += `- Subject: ${r.subjectName} (${r.subjectCode})\n`;
              contextPayload += `  Sessional Test 1 (ST1): ${r.st1}/30, ST2: ${r.st2}/30, ST3: ${r.st3}/30\n`;
              contextPayload += `  Assignments weightage: ${r.assignments}/10, Quizzes: ${r.quizzes}/10\n`;
              contextPayload += `  Calculated Continuous Internal Evaluation (CIE) score: ${r.calculatedTotal || 0}/100\n`;
            });
          } else {
            contextPayload += "No official internal/sessional marks registered in database yet.\n";
          }
        }

        // Syllabus Tracker (Curriculum Progress)
        if (selectedSources?.syllabusTracker && contextData.syllabusTracker) {
          contextPayload += "\n=== SYLLABUS / CURRICULUM PROGRESS ===\n";
          if (contextData.syllabusTracker.subjects && contextData.syllabusTracker.subjects.length > 0) {
            contextData.syllabusTracker.subjects.forEach((s: any) => {
              contextPayload += `- ${s.name} (${s.code || "SUB"}): Completed ${s.chaptersDone || 0}/5 Units, and ${s.assignmentsDone || 0}/5 Assignments done.\n`;
              if (s.notesLink) {
                contextPayload += `  Attached Notes/Syllabus Document Link: ${s.notesLink}\n`;
              }
            });
          } else {
            contextPayload += "No custom progress tracker entries available yet.\n";
          }
        }

        // Lecture notes (Processed summaries and action points)
        if (selectedSources?.lectureNotes && contextData.lectureNotes) {
          contextPayload += "\n=== PROCESSED LECTURES NOTES ===\n";
          if (contextData.lectureNotes.lectures && contextData.lectureNotes.lectures.length > 0) {
            contextData.lectureNotes.lectures.forEach((lec: any) => {
              contextPayload += `Lecture Title: ${lec.title}\n`;
              contextPayload += `Subject: ${lec.subject || "N/A"}\n`;
              contextPayload += `Summary: ${lec.summary || "N/A"}\n`;
              if (lec.sections && lec.sections.length > 0) {
                contextPayload += "Key Concepts covered:\n";
                lec.sections.forEach((sec: any) => {
                  contextPayload += `  * ${sec.title}: ${sec.content || ""}\n`;
                  if (sec.bulletPoints) {
                    sec.bulletPoints.forEach((bp: string) => {
                      contextPayload += `    - ${bp}\n`;
                    });
                  }
                });
              }
              if (lec.actionItems && lec.actionItems.length > 0) {
                contextPayload += `  Recommended Tasks: ${lec.actionItems.join(", ")}\n`;
              }
              contextPayload += "---------------------------------\n";
            });
          } else {
            contextPayload += "No processed lecture notes found in student repository.\n";
          }
        }

        // Academic Assignments
        if (selectedSources?.assignments && contextData.assignments) {
          contextPayload += "\n=== ACADEMIC ASSIGNMENTS ===\n";
          if (contextData.assignments.records && contextData.assignments.records.length > 0) {
            contextData.assignments.records.forEach((a: any) => {
              contextPayload += `- Title: ${a.title}\n`;
              contextPayload += `  Subject: ${a.subjectName} (${a.subjectCode})\n`;
              contextPayload += `  Due Date: ${a.dueDate}\n`;
              contextPayload += `  Description: ${a.description || "N/A"}\n`;
            });
          } else {
            contextPayload += "No pending or uploaded assignments found for this semester.\n";
          }
        }
      }

      const systemInstruction = `You are "Academia07 Pro"—an expert, empathetic, and highly precise RAG Academic Advisor and Intelligent AI Study Coach.
Your purpose is to answer students' academic inquiries, explain lectures, compile study guides, draft targeted practice questions, and suggest sessional improvement paths based STRICTLY on their real-world performance context.

GUIDELINES FOR GENERATING RESPONSES:
1. **Context Grounding (RAG)**: Use the provided student performance telemetry, attendance status, sessional test grades, syllabus tracking, and processed lecture notes to ground your advice. Cite these sources explicitly! (e.g. "I notice in your Computer Science attendance...", "Your ST1 score in ME-302 is 12/30, indicating...").
2. **Personalization Engine**:
   - **Attendance Alerts**: If a subject has attendance below 75%, warn the student with clear numbers and advise them on how many classes they must attend to restore their status.
   - **Performance Diagnostic**: Identify weak subjects (scores below 18/30 in sessional tests) and provide step-by-step revision, quiz-solving, and time-management tips.
   - **Study Schedule Synthesizer**: Create tailored daily study blocks combining their incomplete units (from the progress tracker) with action tasks from their actual lecture notes.
3. **Format**: Maintain professional, encouraging, and clear academic output. Use clean markdown formatting, tables, bold key headers, bulleted action items, and LaTeX formatting (such as $$E = mc^2$$ or $$H_0$$) for formulas.
4. **Authenticity**: Never fabricate mock or placeholder performance numbers if actual data is in the context. If the student lacks data for a chosen source, acknowledge it and suggest that they mark their attendance or log their sessional marks to unlock deeper telemetry.`;

      const geminiHistory = messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));

      const contents = [
        {
          role: "user",
          parts: [{ text: `Here is the current real-time student retrieval context for RAG processing:\n\n${contextPayload}\n\nPlease help me with my queries, utilizing this data proactively!` }]
        },
        {
          role: "model",
          parts: [{ text: "Understood. I have read and digested your entire student academic profile, attendance logs, internal marks, syllabus progress, and lecture notes. I will act as your personalized Academia07 Pro study coach. What academic goal, lecture topic, or performance diagnostic can I help you with today?" }]
        },
        ...geminiHistory
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction,
        }
      });

      const reply = response.text || "I was unable to synthesize a RAG response.";
      return res.json({ success: true, reply });
    } catch (error: any) {
      console.error("Error in RAG advisor chat:", error);
      return res.status(500).json({ error: error.message || "An error occurred during RAG assistant processing." });
    }
  });

  // Mount Vite middleware for dev or serve static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
