<!-- THOUGHT_START -->

## 💡 Technical Thought of the Day

Strive for clean code, deep understanding, and daily incremental progress.

*Daily Insight:* Practice active learning by revising core concepts and teaching peers.

<!-- THOUGHT_END -->

# 🚀 Simplify AI — Office Daily Report Prompt Generator

An intelligent prompt generator and Gemini assistant portal designed to turn messy, voice-dictated notes or bullet points into your company's **exact, standardized Daily Office Report format**.

---

## 🎯 Target Office Report Format

The generated prompts enforce Gemini to strictly follow this exact 4-section markdown layout without any introductory conversational fluff:

```markdown
*Name: Pawan Gangwar*
*Department: IT*
*Date: 25 August 2026*

*Targets*
* Implement backend API endpoints for dynamic slug connection
* Review and update the Product & Jewellery data models
* Clean controller files to match the new schema structure
* Check Google Merchant Center and Search Console for indexing issues

*Work Completed*
* Investigated and set up the slug connection backend structure
* Updated Product Controller and Jewellery Controller logic
* Reviewed Model files and updated required fields
* Inspected Search Console reports and resolved pending crawl warnings

*Results*
* Slug routing is tested and working properly
* Controller and model files updated without any runtime errors
* Merchant Center feed verified and clean

*Pending Tasks*
* Complete final integration testing for dynamic slugs
* Finish remaining updates in Product controllers
```

---

## ⚡ How It Works (4-Step Workflow)

1. **Verify Your Profile**: Set your Name (default: `Pawan Gangwar`), Department (default: `IT`), and Date (auto-defaults to today formatted as `DD MMMM YYYY`). All saved automatically in your browser.
2. **Dictate or Type Rough Notes**: Click **"Voice Dictation"** to speak what you did today, or type quick rough notes.
3. **1-Click "Copy Prompt & Open Gemini"**: Clicking the button copies the optimized Gemini instruction to your clipboard and opens `https://gemini.google.com/app` in a new tab.
4. **Paste in Gemini & Copy to Portal**: Paste into Gemini and press Enter. Gemini outputs only the cleanly formatted report ready to paste into your office HRMS, Slack, or ERP portal!

---

## 🌟 Key Features

- **🚀 1-Click "Copy & Open Gemini" Action**: Instant clipboard copy with automated redirection to Google Gemini.
- **🎙️ In-Browser Voice Dictation**: Dictate your day's work using Web Speech API without typing.
- **🤖 Continuous Gemini Master Prompt Mode**: A one-time setup instruction you can paste into a dedicated Gemini chat so that Gemini *always* outputs in this format whenever you talk to it.
- **Strict Formatting Guardrails**: Disallows filler chat (*"Here is your report..."*), enforces asterisks on headers (`*Name: ...*`, `*Targets*`), and uses `* ` bullet points.
- **🎨 Glassmorphism Modern UI**: Dark & Light theme support, quick date buttons (*Today*, *Yesterday*), and preset templates.
- **💾 Local Persistence & Draft History**: Automatically remembers your settings and recent report drafts in `localStorage`.
- **📥 Direct Export**: Download report as `.txt` or copy formatted markdown with one click.

---

## 💻 How to Run Locally

### Option 1: Direct Browser
Simply double-click or open [`index.html`](file:///P:/SIMPLIFY_AI/index.html) in Chrome, Edge, Brave, or Firefox.

### Option 2: Local Node Server
```bash
npm start
# Server starts at http://localhost:3000
```

### Option 3: Python Server
```bash
python -m http.server 3000
# Server starts at http://localhost:3000
```
