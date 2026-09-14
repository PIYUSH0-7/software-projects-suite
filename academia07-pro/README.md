<!-- THOUGHT_START -->

## 💡 Technical Thought of the Day

Strive for clean code, deep understanding, and daily incremental progress.

*Daily Insight:* Test thoroughly for edge cases, null values, and boundary conditions.

<!-- THOUGHT_END -->

# Academia07 Pro — Full-Stack Academic Portal & AI Study Coach

![Academia07 Pro Banner](https://img.shields.io/badge/Academia07--Pro-Academic%20Management%20%26%20AI%20Tutor-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat-square&logo=vite)
![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-FFCA28?style=flat-square&logo=firebase)
![Gemini AI](https://img.shields.io/badge/Gemini--AI-3.5%20Flash-8E44AD?style=flat-square&logo=google)

> **Academia07 Pro** is a comprehensive academic portal designed for university students, teachers, and administrators. It integrates real-time telemetry tracking, an AI Speech-to-Text Lecture Processor, and a Retrieval-Augmented Generation (RAG) Academic Advisor.

---

## 🌟 Core Modules

### 1. Full-Stack Academic Management System
- **Role-Based Portals**: Unified UI tailored for **Students**, **Teachers**, and **Administrators**.
- **Attendance Tracker**: Real-time attendance logging, target simulation (75% requirement), and admin overrides.
- **Continuous Internal Evaluation (Sessionals)**: Sessional test grades (ST1, ST2, ST3), assignment weightage, quiz scores, and marksheets locking.
- **User Role & Registry Desk**: Admin privilege management, branch assignment, and semester synchronization.
- **Grievance Redressal Desk**: Student query submission with status tracking (`Pending` → `Resolved`).
- **Academic Tools**: AKTU SGPA/CGPA calculator, progress tracker, and assignment upload hub.

### 2. AI Lecture Processing System (Speech & NLP)
- **Real-Time Speech Recognition**: Browser-based speech-to-text recording.
- **NLP Note Synthesizer**: Converts raw lecture transcripts into 4 learning styles (*Comprehensive*, *Simplified ELI5*, *Formulas & Code*, *Exam Prep*).
- **Interactive Workspace**: Visual mind maps, flashcards, sessional mock quizzes with explanations, and PDF exports (`jsPDF` & `html2canvas`).

### 3. RAG AI Assistant & Academic Advisor
- **Context-Grounded RAG**: Retrieves real student performance telemetry (attendance, sessional grades, syllabus progress, and lecture notes).
- **Personalized Coaching**: Detects low attendance (<75%), flags weak sessional subjects (<18/30), synthesizes daily study blocks, and generates targeted practice questions.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https.github.com/PIYUSH0-7/academia07-pro.git
   cd academia07-pro
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 🌐 Live GitHub Links

- **GitHub Repository**: [https://github.com/PIYUSH0-7/academia07-pro](https://github.com/PIYUSH0-7/academia07-pro)
- **Live Deployment**: [https://PIYUSH0-7.github.io/academia07-pro](https://PIYUSH0-7.github.io/academia07-pro)
