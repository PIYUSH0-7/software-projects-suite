import { ResumeData, INITIAL_RESUME_STATE } from "../types";

// Helper to clean up the AI response and extract JSON
export const parseGeminiResponse = (text: string): ResumeData => {
  try {
    // 1. Remove Markdown code blocks if present (```json ... ```)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in the text.");
    }
    
    const jsonString = jsonMatch[0];
    const parsedData = JSON.parse(jsonString) as Partial<ResumeData>;

    // 2. Merge with defaults to ensure safety
    const safeData: ResumeData = {
      ...INITIAL_RESUME_STATE, // Fallback defaults
      ...parsedData, // AI Values
      education: Array.isArray(parsedData.education) ? parsedData.education : [],
      internships: Array.isArray(parsedData.internships) ? parsedData.internships : [],
      projects: Array.isArray(parsedData.projects) ? parsedData.projects : [],
      achievements: Array.isArray(parsedData.achievements) ? parsedData.achievements : [],
      certificates: Array.isArray(parsedData.certificates) ? parsedData.certificates : [],
      extracurricular: Array.isArray(parsedData.extracurricular) ? parsedData.extracurricular : [],
      technicalSkills: parsedData.technicalSkills || { tools: "", skills: "" },
    };

    return safeData;
  } catch (error) {
    console.error("Error parsing Gemini output:", error);
    throw new Error("Could not parse the data pasted. Please ensure you copied the JSON code block from Gemini.");
  }
};

export const createGeminiPrompt = (currentData: ResumeData): string => {
  const currentJson = JSON.stringify(currentData, null, 2);

  return `
ACT AS: An Expert ATS Resume Optimizer & Senior Career Coach.
CONTEXT: I am a college student who needs to submit a resume in a STRICT JSON FORMAT.

MY CURRENT RESUME DATA:
${currentJson}

YOUR GOAL: 
1. Review my data.
2. Improve the bullet points to be high-impact (Action Verbs + Metrics).
3. Output the final result in the EXACT JSON format required.

STEP 1: THE OUTPUT (Strict JSON):
- Output ONLY a single valid JSON object.
- Adhere strictly to this structure:
{
  "fullName": "", "city": "", "state": "", "phone": "", "email": "", "linkedin": "", "github": "", "portfolio": "",
  "education": [{ "institution": "", "degree": "", "startDate": "", "endDate": "", "score": "", "location": "" }],
  "technicalSkills": { "tools": "", "skills": "" },
  "internships": [{ "company": "", "role": "", "startDate": "", "endDate": "", "location": "", "points": [] }],
  "projects": [{ "name": "", "technologies": "", "startDate": "", "points": [] }],
  "achievements": [],
  "certificates": [{ "name": "", "issuer": "", "date": "" }],
  "extracurricular": [{ "organization": "", "role": "", "startDate": "", "endDate": "", "points": [] }]
}
`;
};

// NEW: Prompt for "Easy Mode" raw text input
export const createRawDataPrompt = (
  targetRole: string, 
  rawText: string,
  educationStr: string = "",
  skillsStr: string = ""
): string => {
  return `
ACT AS: An Expert ATS Resume Optimizer.
CONTEXT: I want to build a high-quality ATS-friendly resume for the role of "${targetRole}".
I have some rough notes and details about my background.

HERE IS MY INFO:
${educationStr ? `EDUCATION DETAILS: ${educationStr}` : ''}
${skillsStr ? `KEY SKILLS: ${skillsStr}` : ''}

ROUGH EXPERIENCE / PROJECTS / SUMMARY:
${rawText}

YOUR TASK:
1. Parse my info to extract relevant details (Education, Skills, Projects, Experience).
2. "Hallucinate" professional improvements: Use the context of the "${targetRole}" position to rewrite my rough points into professional, metric-driven, ATS-optimized bullet points. 
   - Example: If I say "worked on frontend", you change it to "Architected responsive UI using React.js, improving page load speed by 30%".
3. Fill in gaps logically if minor details are missing (e.g., precise dates or locations), but keep names accurate.
4. Ensure the Education and Skills I provided are formatted correctly in the JSON.

OUTPUT FORMAT (STRICT JSON ONLY):
Return ONLY a valid JSON object matching this schema exactly. Do not output Markdown or extra text.

{
  "fullName": "Name from text or placeholder",
  "city": "City",
  "state": "State",
  "phone": "Phone",
  "email": "Email",
  "linkedin": "LinkedIn URL",
  "github": "GitHub URL",
  "portfolio": "Portfolio URL",
  "education": [
    { "institution": "College Name", "degree": "Degree", "startDate": "MMM YYYY", "endDate": "MMM YYYY", "score": "CGPA/Percentage", "location": "City" }
  ],
  "technicalSkills": {
    "tools": "List of tools (VS Code, Git, etc)",
    "skills": "List of skills (Java, Python, Leadership)"
  },
  "internships": [
    { "company": "Company Name", "role": "Job Title", "startDate": "MMM YYYY", "endDate": "MMM YYYY", "location": "City/Remote", "points": ["Action verb point 1", "Action verb point 2"] }
  ],
  "projects": [
    { "name": "Project Name", "technologies": "Tech Stack Used", "startDate": "MMM YYYY", "points": ["Developed X using Y...", "Integrated Z..."] }
  ],
  "achievements": ["Achievement 1", "Achievement 2"],
  "certificates": [
    { "name": "Cert Name", "issuer": "Issuer", "date": "Date Range" }
  ],
  "extracurricular": [
    { "organization": "Org Name", "role": "Role", "startDate": "Date", "endDate": "Date", "points": ["Point 1"] }
  ]
}
`;
};

// NEW: Prompt for Improving an existing resume based on specific feedback
export const createImprovementPrompt = (
  currentData: ResumeData,
  feedback: string
): string => {
  const currentJson = JSON.stringify(currentData, null, 2);
  
  return `
ACT AS: An Expert ATS Resume Optimizer.
CONTEXT: I have an existing resume, but I need to improve it based on specific feedback.

MY CURRENT RESUME (JSON):
${currentJson}

THE PROBLEM / FEEDBACK TO ADDRESS:
"${feedback}"

YOUR TASK:
1. Analyze my current resume JSON.
2. Apply changes strictly to address the feedback provided above (e.g., if I said "add more keywords", rewrite bullets to include technical terms; if I said "fix grammar", fix it).
3. Keep the rest of the data intact unless it needs improvement for flow/impact.

OUTPUT FORMAT (STRICT JSON ONLY):
Return ONLY a valid JSON object matching the input schema exactly.
`;
};