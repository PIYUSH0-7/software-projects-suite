
import { Domain } from './types';

export const INITIAL_DOMAINS: Domain[] = [
  {
    id: 'exam-calendar',
    title: '10. Exam Calendar & Syllabus',
    description: 'The Official 2025 Exam Schedule. Detailed syllabus and patterns for every test from Feb to Dec.',
    iconName: 'Calendar',
    phase: 'All Phases',
    examDate: 'Critical',
    strategy: 'Preparation > Panic',
    mindset: 'Performance',
    resources: {
      book: 'CareerLaunch OS PDF',
      teacher: 'Self-Evaluation'
    },
    sections: [
      {
        id: 'ec-p1',
        title: 'Phase 1 Exams (Mar 17 - May 17) - Foundation',
        tasks: [
          { 
            id: 'ex-1-1', 
            text: '17 May: DSA with Python', 
            notes: 'SYLLABUS: Arrays, Strings, Searching, Sorting, HashMaps, Two Pointers, Sliding Window.\nPATTERN: 1) HackerRank Certification. 2) 3-Hour AI Mock Exam (5Qs: 2 Easy, 2 Med, 1 Hard).', 
            isCompleted: false 
          },
          { 
            id: 'ex-1-2', 
            text: '17 May: Full Stack Web Development', 
            notes: 'SYLLABUS: HTML5, CSS3, JS ES6+, React Components, Hooks, Node.js API, MongoDB CRUD.\nPATTERN: Build & Deploy a Portfolio Site + Blog within 6 Hours.', 
            isCompleted: false 
          },
          { 
            id: 'ex-1-3', 
            text: '17 May: Life Skills (Learning + Health)', 
            notes: 'SYLLABUS: Learning Management (Meta-learning, Spaced Repetition) + Health Management (Sleep, Diet, Exercise).\nPATTERN: 2-Page Essay on implementation + Personal Health Audit Report.', 
            isCompleted: false 
          },
          { 
            id: 'ex-1-4', 
            text: '17 May: Phase 1 Result Analysis', 
            notes: 'ACTION: Write Strengths + Weaknesses Report. Add AI Analysis of performance.', 
            isCompleted: false 
          },
        ]
      },
      {
        id: 'ec-p2',
        title: 'Phase 2 Exams (May 17 - Jun 17) - Development',
        tasks: [
          { 
            id: 'ex-2-1', 
            text: '17 June: App Development', 
            notes: 'SYLLABUS: React Native, Expo, Hooks, Navigation, API Fetching, Authentication, Native Features.\nPATTERN: Build "Todo App with Auth & Cloud Sync" (Time: 4 Hours).', 
            isCompleted: false 
          },
          { 
            id: 'ex-2-2', 
            text: '17 June: Advanced DSA', 
            notes: 'SYLLABUS: Trees, Graphs, DP, Heaps, 10 Core Patterns, System Design Basics.\nPATTERN: LeetCode Contest Simulation (4 Problems in 90 mins: 1 Med, 3 Hard).', 
            isCompleted: false 
          },
          { 
            id: 'ex-2-3', 
            text: '17 June: Life Skills (Thinking + Comm)', 
            notes: 'SYLLABUS: Thinking Skills (Biases, Logic) + Communication (Active Listening, Public Speaking).\nPATTERN: AI Roleplay Scenario + Recorded Speech Analysis.', 
            isCompleted: false 
          },
          { 
            id: 'ex-2-4', 
            text: '17 June: Cumulative Technical Exam I', 
            notes: 'SYLLABUS: DSA (Python) + MERN + App Dev + Adv DSA.\nPATTERN: System Design Interview Mock + 2 Hard Coding Problems.', 
            isCompleted: false 
          },
        ]
      },
      {
        id: 'ec-p3',
        title: 'Phase 3 Exams (Jun 17 - Jul 17) - Modern Skills',
        tasks: [
          { 
            id: 'ex-3-1', 
            text: '17 July: Agentic AI', 
            notes: 'SYLLABUS: LLMs, Prompt Engineering, RAG, Agent Frameworks (LangChain), Vibe Coding.\nPATTERN: Build a RAG Chatbot for specific PDF data.', 
            isCompleted: false 
          },
          { 
            id: 'ex-3-2', 
            text: '17 July: Soft Skills Placement Test', 
            notes: 'SYLLABUS: Resume, STAR Stories, Interview Etiquette, Emotional Intelligence.\nPATTERN: Mock HR Interview (Pass/Fail) + Behavioral Q&A.', 
            isCompleted: false 
          },
          { 
            id: 'ex-3-3', 
            text: '17 July: Life Skills (Time + Finance)', 
            notes: 'SYLLABUS: Time Management (Deep Work) + Finance (Budgeting, Investing).\nPATTERN: Submit "Financial Independence Plan" + Time Audit.', 
            isCompleted: false 
          },
          { 
            id: 'ex-3-4', 
            text: '17 July: Cumulative Technical Exam II', 
            notes: 'SYLLABUS: All previous technical skills + AI Agents.\nPATTERN: Full-stack AI App Challenge (8 Hours) - Build, Deploy, Demo.', 
            isCompleted: false 
          },
        ]
      },
      {
        id: 'ec-p4',
        title: 'Phase 4 Exams (Jul 17 - Aug 17) - Mastery',
        tasks: [
          { 
            id: 'ex-4-1', 
            text: '17 August: Must-Have Skills Exams', 
            notes: 'SYLLABUS: Personal Branding, Prod Mgmt, Dev A-Z.\nPATTERN: Portfolio Review (GitHub/LinkedIn/Twitter audit). Brand Reach Analysis.', 
            isCompleted: false 
          },
          { 
            id: 'ex-4-2', 
            text: '17 August: Mastery Tech Exam', 
            notes: 'SYLLABUS: Everything. Focus on Speed, Optimization, and Edge Cases.\nPATTERN: "Impossible" Coding Challenge (Google Hard level) - Solve 1 in 45 mins.', 
            isCompleted: false 
          },
        ]
      },
      {
        id: 'ec-final',
        title: 'FINAL EXAMS (Aug 17 - Sep 17) - Life & Career Deciding',
        tasks: [
          { 
            id: 'ex-final-1', 
            text: '17 September: THE GRAND TECHNICAL EXAM', 
            notes: 'SYLLABUS: All 6 Technical Domains (DSA, Web, App, Adv DSA, AI, Soft Skills).\nPATTERN: Part 1: 3-Hour Coding. Part 2: Dry Placement Drive (Tech Round + System Design + HR).', 
            isCompleted: false 
          },
          { 
            id: 'ex-final-2', 
            text: '17 September: THE LIFE SKILLS FINAL', 
            notes: 'SYLLABUS: All 8 Life Skills.\nPATTERN: AI-Generated Scenario Test + "Life Rule" Thesis Defense.', 
            isCompleted: false 
          },
        ]
      }
    ]
  },
  {
    id: 'dsa-python',
    title: '1. DSA with Python',
    description: 'Builds the foundation to solve LeetCode Medium. (Full 12 Phases)',
    iconName: 'Code',
    phase: 'Phase 1',
    examDate: '17 March - 17 May',
    strategy: 'Pattern Recognition + Speed',
    mindset: 'Edge Cases',
    resources: {
      book: 'Grokking Algorithms',
      teacher: 'Scott Barrett (Udemy) / Abdul Bari (YT)'
    },
    sections: [
      {
        id: 'dsa-p0',
        title: 'Phase 0: Foundations (Week 1-2)',
        tasks: [
          { id: 'dp-0-1', text: 'Python Basics: Variables, loops, functions, classes', isCompleted: false },
          { id: 'dp-0-2', text: 'Time & Space Complexity: Big O Mastery', isCompleted: false },
          { id: 'dp-0-3', text: 'Analyze O(1), O(n), O(log n), O(n²)', isCompleted: false },
        ]
      },
      {
        id: 'dsa-p1',
        title: 'Phase 1: Basic Data Structures (Week 3-6)',
        tasks: [
          { id: 'dp-1-1', text: 'Arrays: Slicing, Two Pointers, Sliding Window', isCompleted: false },
          { id: 'dp-1-2', text: 'Strings: Manipulation, Anagrams, Palindromes', isCompleted: false },
          { id: 'dp-1-3', text: 'Searching: Binary Search (Iterative & Recursive)', isCompleted: false },
          { id: 'dp-1-4', text: 'Sorting: Merge Sort, Quick Sort (Concepts)', isCompleted: false },
          { id: 'dp-1-5', text: 'Hash Maps: Frequency Counter pattern', isCompleted: false },
        ]
      },
      {
        id: 'dsa-p2',
        title: 'Phase 2: Linear Data Structures (Week 7-10)',
        tasks: [
          { id: 'dp-2-1', text: 'Linked Lists: Reverse, Detect Cycle, Merge', isCompleted: false },
          { id: 'dp-2-2', text: 'Stacks: Valid Parentheses, Browser History', isCompleted: false },
          { id: 'dp-2-3', text: 'Queues: BFS Implementation basics', isCompleted: false },
          { id: 'dp-2-4', text: 'Practice 20+ String Pattern problems', isCompleted: false },
        ]
      },
      {
        id: 'dsa-p3',
        title: 'Phase 3: Tree Data Structures (Week 11-15)',
        tasks: [
          { id: 'dp-3-1', text: 'Binary Trees: Traversals (In/Pre/Post)', isCompleted: false },
          { id: 'dp-3-2', text: 'BST: Search, Insert, Delete, Validation', isCompleted: false },
          { id: 'dp-3-3', text: 'Tree Problems: Max Depth, Path Sum, LCA', isCompleted: false },
          { id: 'dp-3-4', text: 'Solve 30+ Tree problems', isCompleted: false },
        ]
      },
      {
        id: 'dsa-p4',
        title: 'Phase 4: Heap & Priority Queue (Week 16-17)',
        tasks: [
          { id: 'dp-4-1', text: 'Min-Heap & Max-Heap Implementation', isCompleted: false },
          { id: 'dp-4-2', text: 'Top K Frequent Elements', isCompleted: false },
          { id: 'dp-4-3', text: 'Merge K Sorted Lists', isCompleted: false },
        ]
      },
      {
        id: 'dsa-p5',
        title: 'Phase 5: Graph Data Structures (Week 18-22)',
        tasks: [
          { id: 'dp-5-1', text: 'Graph Representation: Adjacency List/Matrix', isCompleted: false },
          { id: 'dp-5-2', text: 'DFS & BFS Traversals (Iterative/Recursive)', isCompleted: false },
          { id: 'dp-5-3', text: 'Topological Sort (Course Schedule)', isCompleted: false },
          { id: 'dp-5-4', text: 'Shortest Path: Dijkstra, Bellman-Ford', isCompleted: false },
          { id: 'dp-5-5', text: 'Union-Find: Cycle detection, Connected Components', isCompleted: false },
        ]
      },
      {
        id: 'dsa-p6',
        title: 'Phase 6: Coding Patterns (Week 23-25)',
        tasks: [
          { id: 'dp-6-1', text: 'Master Two Pointers & Sliding Window', isCompleted: false },
          { id: 'dp-6-2', text: 'Master Divide and Conquer', isCompleted: false },
          { id: 'dp-6-3', text: 'Master Greedy Algorithms', isCompleted: false },
          { id: 'dp-6-4', text: 'Master Backtracking (Permutations, Subsets)', isCompleted: false },
        ]
      },
      {
        id: 'dsa-p7',
        title: 'Phase 7: Dynamic Programming (Week 26-30)',
        tasks: [
          { id: 'dp-7-1', text: '1D DP: Climbing Stairs, House Robber', isCompleted: false },
          { id: 'dp-7-2', text: '2D DP: Unique Paths, Min Path Sum', isCompleted: false },
          { id: 'dp-7-3', text: 'Knapsack Problems (0/1, Unbounded)', isCompleted: false },
          { id: 'dp-7-4', text: 'LCS and Edit Distance', isCompleted: false },
        ]
      },
      {
        id: 'dsa-p8',
        title: 'Phase 8: Matrix & 2D Problems (Week 31-32)',
        tasks: [
          { id: 'dp-8-1', text: 'Matrix Traversals: Spiral, Rotate', isCompleted: false },
          { id: 'dp-8-2', text: 'Matrix DP: Unique Paths, Min Path', isCompleted: false },
          { id: 'dp-8-3', text: 'Graph on Matrix: Number of Islands (DFS/BFS)', isCompleted: false },
        ]
      },
      {
        id: 'dsa-p9',
        title: 'Phase 9: Bit Manipulation (Week 33)',
        tasks: [
          { id: 'dp-9-1', text: 'Basic Operations: XOR, Shift, Set/Clear Bit', isCompleted: false },
          { id: 'dp-9-2', text: 'Problems: Single Number, Counting Bits', isCompleted: false },
        ]
      },
      {
        id: 'dsa-p10',
        title: 'Phase 10: Advanced Topics (Week 34-35)',
        tasks: [
          { id: 'dp-10-1', text: 'Tries (Prefix Trees): Autocomplete', isCompleted: false },
          { id: 'dp-10-2', text: 'Segment Trees: Range Queries', isCompleted: false },
          { id: 'dp-10-3', text: 'Monotonic Stack: Next Greater Element', isCompleted: false },
        ]
      },
      {
        id: 'dsa-p11',
        title: 'Phase 11: Mixed Interview Problems (Week 36-40)',
        tasks: [
          { id: 'dp-11-1', text: 'Solve 15+ Hard Array Problems', isCompleted: false },
          { id: 'dp-11-2', text: 'Solve 12+ Hard String Problems', isCompleted: false },
          { id: 'dp-11-3', text: 'Solve 15+ Hard Tree/Graph Problems', isCompleted: false },
        ]
      },
      {
        id: 'dsa-p12',
        title: 'Phase 12: Mock Interviews (Week 41-48)',
        tasks: [
          { id: 'dp-12-1', text: 'Timed Sessions: 2 Mediums in 45 mins', isCompleted: false },
          { id: 'dp-12-2', text: 'Mock Interview on Pramp/Interviewing.io', isCompleted: false },
          { id: 'dp-12-3', text: 'Revisit Weak Areas', isCompleted: false },
        ]
      }
    ]
  },
  {
    id: 'mern',
    title: '2. FullStack Web Development',
    description: 'Gives strong projects + portfolio. (Full 12 Phases)',
    iconName: 'Layout',
    phase: 'Phase 1',
    examDate: '17 March - 17 May',
    strategy: 'Build - Iterate - Deploy',
    mindset: 'Architecture',
    resources: {
      book: 'React, TS & Node - David Choi',
      teacher: 'Brad Traversy (Udemy) / Traversy Media (YT)'
    },
    sections: [
      {
        id: 'mern-p0',
        title: 'Phase 0: Web Fundamentals',
        tasks: [
          { id: 'mp-0-1', text: 'HTTP/HTTPS, Client-Server Architecture', isCompleted: false },
          { id: 'mp-0-2', text: 'Setup Node.js, NPM, VS Code, Git', isCompleted: false },
        ]
      },
      {
        id: 'mern-p1',
        title: 'Phase 1: HTML & CSS',
        tasks: [
          { id: 'mp-1-1', text: 'Semantic HTML5 & Accessibility', isCompleted: false },
          { id: 'mp-1-2', text: 'CSS Flexbox & Grid Mastery', isCompleted: false },
          { id: 'mp-1-3', text: 'Tailwind CSS Basics', isCompleted: false },
        ]
      },
      {
        id: 'mern-p2',
        title: 'Phase 2: JavaScript Essentials',
        tasks: [
          { id: 'mp-2-1', text: 'ES6+: Arrow functions, Destructuring, Spread', isCompleted: false },
          { id: 'mp-2-2', text: 'Async/Await, Promises, Callbacks', isCompleted: false },
          { id: 'mp-2-3', text: 'DOM Manipulation & Events', isCompleted: false },
        ]
      },
      {
        id: 'mern-p3',
        title: 'Phase 3: Version Control',
        tasks: [
          { id: 'mp-3-1', text: 'Git Init, Stage, Commit', isCompleted: false },
          { id: 'mp-3-2', text: 'Branching, Merging, Resolving Conflicts', isCompleted: false },
          { id: 'mp-3-3', text: 'GitHub Actions Basics (CI/CD preview)', isCompleted: false },
        ]
      },
      {
        id: 'mern-p4',
        title: 'Phase 4: React.js (Frontend)',
        tasks: [
          { id: 'mp-4-1', text: 'Virtual DOM, JSX, Components', isCompleted: false },
          { id: 'mp-4-2', text: 'Hooks: useState, useEffect, useContext, useRef', isCompleted: false },
          { id: 'mp-4-3', text: 'React Router v6+', isCompleted: false },
          { id: 'mp-4-4', text: 'State Management: Context API / Redux', isCompleted: false },
        ]
      },
      {
        id: 'mern-p5',
        title: 'Phase 5: Node.js (Backend)',
        tasks: [
          { id: 'mp-5-1', text: 'Event Loop, File System, Modules', isCompleted: false },
          { id: 'mp-5-2', text: 'Express.js Fundamentals & Middleware', isCompleted: false },
          { id: 'mp-5-3', text: 'REST API Design Principles', isCompleted: false },
          { id: 'mp-5-4', text: 'Authentication: JWT, Cookies, Multer', isCompleted: false },
        ]
      },
      {
        id: 'mern-p6',
        title: 'Phase 6: MongoDB',
        tasks: [
          { id: 'mp-6-1', text: 'NoSQL Concepts & Atlas Setup', isCompleted: false },
          { id: 'mp-6-2', text: 'Mongoose Schemas & Models', isCompleted: false },
          { id: 'mp-6-3', text: 'Aggregation Framework', isCompleted: false },
        ]
      },
      {
        id: 'mern-p7',
        title: 'Phase 7: Full-Stack Integration',
        tasks: [
          { id: 'mp-7-1', text: 'Connect React to Express API', isCompleted: false },
          { id: 'mp-7-2', text: 'Handle CORS & Env Variables', isCompleted: false },
          { id: 'mp-7-3', text: 'Build a Full-Stack CRUD App', isCompleted: false },
        ]
      },
      {
        id: 'mern-p8',
        title: 'Phase 8: Testing & Debugging',
        tasks: [
          { id: 'mp-8-1', text: 'Chrome DevTools & VS Code Debugger', isCompleted: false },
          { id: 'mp-8-2', text: 'Unit Testing (Jest)', isCompleted: false },
          { id: 'mp-8-3', text: 'API Testing (Postman)', isCompleted: false },
        ]
      },
      {
        id: 'mern-p9',
        title: 'Phase 9: Advanced Topics',
        tasks: [
          { id: 'mp-9-1', text: 'SSR with Next.js (Basics)', isCompleted: false },
          { id: 'mp-9-2', text: 'WebSockets (Socket.io) for Real-time', isCompleted: false },
          { id: 'mp-9-3', text: 'Performance Optimization (Memo, Lazy Loading)', isCompleted: false },
        ]
      },
      {
        id: 'mern-p10',
        title: 'Phase 10: Deployment',
        tasks: [
          { id: 'mp-10-1', text: 'Deploy Frontend (Vercel/Netlify)', isCompleted: false },
          { id: 'mp-10-2', text: 'Deploy Backend (Render/Railway)', isCompleted: false },
          { id: 'mp-10-3', text: 'CI/CD Pipelines with GitHub Actions', isCompleted: false },
        ]
      },
      {
        id: 'mern-p11',
        title: 'Phase 11: Project Building',
        tasks: [
          { id: 'mp-11-1', text: 'Project 1: E-Commerce API', isCompleted: false },
          { id: 'mp-11-2', text: 'Project 2: Social Media App', isCompleted: false },
          { id: 'mp-11-3', text: 'Host live demo & add to Portfolio', isCompleted: false },
        ]
      },
      {
        id: 'mern-p12',
        title: 'Phase 12: Industry Prep',
        tasks: [
          { id: 'mp-12-1', text: 'System Design Basics for Web', isCompleted: false },
          { id: 'mp-12-2', text: 'Mock Interviews (MERN specific)', isCompleted: false },
        ]
      }
    ]
  },
  {
    id: 'app-dev',
    title: '3. App Development',
    description: 'React Native iOS + Android. (Full 16 Phases)',
    iconName: 'Smartphone',
    phase: 'Phase 2',
    examDate: '17 May - 17 June',
    strategy: 'Mobile-First',
    mindset: 'UX Thinking',
    resources: {
      book: 'React Native in Action - Nader Dabit',
      teacher: 'Maximilian (Udemy) / Dave Gray (YT)'
    },
    sections: [
      {
        id: 'rn-p0',
        title: 'Phase 0: Foundational Concepts',
        tasks: [
          { id: 'rnp-0-1', text: 'JS/TS Prerequisites', isCompleted: false },
          { id: 'rnp-0-2', text: 'Setup Node, Watchman, Xcode/Android Studio', isCompleted: false },
        ]
      },
      {
        id: 'rn-p1',
        title: 'Phase 1: Fundamentals',
        tasks: [
          { id: 'rnp-1-1', text: 'Expo vs Bare Workflow', isCompleted: false },
          { id: 'rnp-1-2', text: 'Core Components: View, Text, Image, ScrollView', isCompleted: false },
          { id: 'rnp-1-3', text: 'Flexbox for Mobile Layouts', isCompleted: false },
        ]
      },
      {
        id: 'rn-p2',
        title: 'Phase 2: Core Components & Styling',
        tasks: [
          { id: 'rnp-2-1', text: 'FlatList & SectionList', isCompleted: false },
          { id: 'rnp-2-2', text: 'Pressable & TouchableOpacity', isCompleted: false },
          { id: 'rnp-2-3', text: 'Modal, Switch, ActivityIndicator', isCompleted: false },
        ]
      },
      {
        id: 'rn-p3',
        title: 'Phase 3: Hooks & State',
        tasks: [
          { id: 'rnp-3-1', text: 'React Native Hooks', isCompleted: false },
          { id: 'rnp-3-2', text: 'State Management (Zustand/Redux)', isCompleted: false },
          { id: 'rnp-3-3', text: 'Custom Hooks for logic reuse', isCompleted: false },
        ]
      },
      {
        id: 'rn-p4',
        title: 'Phase 4: Navigation',
        tasks: [
          { id: 'rnp-4-1', text: 'React Navigation v6+', isCompleted: false },
          { id: 'rnp-4-2', text: 'Stack, Tab, & Drawer Navigators', isCompleted: false },
          { id: 'rnp-4-3', text: 'Deep Linking', isCompleted: false },
        ]
      },
      {
        id: 'rn-p5',
        title: 'Phase 5: API & Data Fetching',
        tasks: [
          { id: 'rnp-5-1', text: 'Fetch & Axios', isCompleted: false },
          { id: 'rnp-5-2', text: 'TanStack Query (React Query)', isCompleted: false },
          { id: 'rnp-5-3', text: 'API Best Practices', isCompleted: false },
        ]
      },
      {
        id: 'rn-p6',
        title: 'Phase 6: Forms & Input',
        tasks: [
          { id: 'rnp-6-1', text: 'TextInput & Keyboard Handling', isCompleted: false },
          { id: 'rnp-6-2', text: 'Formik + Yup Validation', isCompleted: false },
        ]
      },
      {
        id: 'rn-p7',
        title: 'Phase 7: Auth & Security',
        tasks: [
          { id: 'rnp-7-1', text: 'JWT Auth Flow', isCompleted: false },
          { id: 'rnp-7-2', text: 'Secure Storage (Keychain)', isCompleted: false },
          { id: 'rnp-7-3', text: 'Social Login (Google/Apple)', isCompleted: false },
        ]
      },
      {
        id: 'rn-p8',
        title: 'Phase 8: Native Features',
        tasks: [
          { id: 'rnp-8-1', text: 'Camera & Photo Library', isCompleted: false },
          { id: 'rnp-8-2', text: 'Geolocation & Maps', isCompleted: false },
          { id: 'rnp-8-3', text: 'Push Notifications', isCompleted: false },
        ]
      },
      {
        id: 'rn-p9',
        title: 'Phase 9: Animations',
        tasks: [
          { id: 'rnp-9-1', text: 'Animated API Basics', isCompleted: false },
          { id: 'rnp-9-2', text: 'Reanimated 3 Mastery', isCompleted: false },
          { id: 'rnp-9-3', text: 'Gesture Handler', isCompleted: false },
        ]
      },
      {
        id: 'rn-p10',
        title: 'Phase 10: Testing',
        tasks: [
          { id: 'rnp-10-1', text: 'Unit Testing (Jest)', isCompleted: false },
          { id: 'rnp-10-2', text: 'E2E Testing (Detox/Maestro)', isCompleted: false },
        ]
      },
      {
        id: 'rn-p11',
        title: 'Phase 11: Performance',
        tasks: [
          { id: 'rnp-11-1', text: 'Rendering Optimization (Memo)', isCompleted: false },
          { id: 'rnp-11-2', text: 'List Performance', isCompleted: false },
          { id: 'rnp-11-3', text: 'Memory Management', isCompleted: false },
        ]
      },
      {
        id: 'rn-p14',
        title: 'Phase 14: Deployment',
        tasks: [
          { id: 'rnp-14-1', text: 'App Store Connect & TestFlight', isCompleted: false },
          { id: 'rnp-14-2', text: 'Google Play Console', isCompleted: false },
          { id: 'rnp-14-3', text: 'EAS Build & Submit', isCompleted: false },
        ]
      },
      {
        id: 'rn-p15',
        title: 'Phase 15: React Native Web',
        tasks: [
          { id: 'rnp-15-1', text: 'Building for Web with RN', isCompleted: false },
          { id: 'rnp-15-2', text: 'Responsive Design Strategies', isCompleted: false },
        ]
      },
      {
        id: 'rn-p16',
        title: 'Phase 16: Production Practices',
        tasks: [
          { id: 'rnp-16-1', text: 'Code Quality & CI/CD', isCompleted: false },
          { id: 'rnp-16-2', text: 'Crash Reporting (Sentry)', isCompleted: false },
          { id: 'rnp-16-3', text: 'Analytics', isCompleted: false },
        ]
      }
    ]
  },
  {
    id: 'adv-dsa',
    title: '4. Advanced DSA',
    description: 'MOST important for FAANG. (Full 12 Phases)',
    iconName: 'Cpu',
    phase: 'Phase 2',
    examDate: '17 May - 17 June',
    strategy: 'Variation Mastery',
    mindset: 'System Thinking',
    resources: {
      book: 'Competitive Programming 4 - Halim',
      teacher: 'NeetCode (YT) / Striver'
    },
    sections: [
      {
        id: 'ad-p0',
        title: 'Phase 0: Advanced Refresh',
        tasks: [
          { id: 'ad-0-1', text: 'Complexities & Master Theorem', isCompleted: false },
          { id: 'ad-0-2', text: 'Recursion Master Class', isCompleted: false },
        ]
      },
      {
        id: 'ad-p1',
        title: 'Phase 1: The 10 Critical Patterns',
        tasks: [
          { id: 'ad-1-1', text: 'Two Pointers (Hard variations)', isCompleted: false },
          { id: 'ad-1-2', text: 'Sliding Window (Variable size)', isCompleted: false },
          { id: 'ad-1-3', text: 'Monotonic Stack', isCompleted: false },
          { id: 'ad-1-4', text: 'Top K Elements (Heap)', isCompleted: false },
        ]
      },
      {
        id: 'ad-p2',
        title: 'Phase 2: Adv Array & String',
        tasks: [
          { id: 'ad-2-1', text: 'KMP & Rabin-Karp', isCompleted: false },
          { id: 'ad-2-2', text: 'Manacher\'s Algorithm', isCompleted: false },
          { id: 'ad-2-3', text: 'Z-Algorithm', isCompleted: false },
        ]
      },
      {
        id: 'ad-p3',
        title: 'Phase 3: Advanced Tree & Graph',
        tasks: [
          { id: 'ad-3-1', text: 'Serialize/Deserialize Binary Tree', isCompleted: false },
          { id: 'ad-3-2', text: 'LCA in Binary Tree', isCompleted: false },
          { id: 'ad-3-3', text: 'Dijkstra, Bellman-Ford, Floyd-Warshall', isCompleted: false },
          { id: 'ad-3-4', text: 'Union-Find (Disjoint Set)', isCompleted: false },
        ]
      },
      {
        id: 'ad-p4',
        title: 'Phase 4: Advanced DP',
        tasks: [
          { id: 'ad-4-1', text: 'DP on Trees', isCompleted: false },
          { id: 'ad-4-2', text: 'DP on Strings (Wildcard Matching)', isCompleted: false },
          { id: 'ad-4-3', text: 'DP with Bitmask', isCompleted: false },
        ]
      },
      {
        id: 'ad-p5',
        title: 'Phase 5: System-Level DSA',
        tasks: [
          { id: 'ad-5-1', text: 'LRU/LFU Cache Implementation', isCompleted: false },
          { id: 'ad-5-2', text: 'Design Twitter / Rate Limiter', isCompleted: false },
          { id: 'ad-5-3', text: 'Connect DSA to System Design', isCompleted: false },
        ]
      },
      {
        id: 'ad-p6',
        title: 'Phase 6: Problem Solving Under Pressure',
        tasks: [
          { id: 'ad-6-1', text: 'Interview Execution Strategy', isCompleted: false },
          { id: 'ad-6-2', text: 'Think Out Loud Practice', isCompleted: false },
        ]
      },
      {
        id: 'ad-p7',
        title: 'Phase 7: Mock Interviews',
        tasks: [
          { id: 'ad-7-1', text: 'Pramp Sessions', isCompleted: false },
          { id: 'ad-7-2', text: 'Interviewing.io Sessions', isCompleted: false },
        ]
      },
      {
        id: 'ad-p8',
        title: 'Phase 8: Company Specific',
        tasks: [
          { id: 'ad-8-1', text: 'Google: DP & Graph Hard', isCompleted: false },
          { id: 'ad-8-2', text: 'Amazon: Sliding Window & Arrays', isCompleted: false },
          { id: 'ad-8-3', text: 'Meta: Tree & Graph', isCompleted: false },
        ]
      },
      {
        id: 'ad-p9',
        title: 'Phase 9: Advanced Data Structures',
        tasks: [
          { id: 'ad-9-1', text: 'Segment Trees', isCompleted: false },
          { id: 'ad-9-2', text: 'Fenwick Trees', isCompleted: false },
          { id: 'ad-9-3', text: 'Tries (Advanced)', isCompleted: false },
        ]
      },
      {
        id: 'ad-p10',
        title: 'Phase 10: Real-World Integration',
        tasks: [
          { id: 'ad-10-1', text: 'DSA in Database Indexing', isCompleted: false },
          { id: 'ad-10-2', text: 'DSA in Networking', isCompleted: false },
        ]
      },
      {
        id: 'ad-p11',
        title: 'Phase 11: Competitive Programming',
        tasks: [
          { id: 'ad-11-1', text: 'Network Flow', isCompleted: false },
          { id: 'ad-11-2', text: 'Number Theory', isCompleted: false },
        ]
      },
      {
        id: 'ad-p12',
        title: 'Phase 12: Final Mastery',
        tasks: [
          { id: 'ad-12-1', text: 'Pattern Recognition Drills', isCompleted: false },
          { id: 'ad-12-2', text: 'Weak Area Identification', isCompleted: false },
        ]
      }
    ]
  },
  {
    id: 'agentic-ai',
    title: '5. Agentic AI / Emerging Skills',
    description: 'FAANG loves new generation skills: AI/LLMs, Agents, RAG.',
    iconName: 'Bot',
    phase: 'Phase 3',
    examDate: '17 June - 17 July',
    strategy: 'Rapid Experimentation',
    mindset: 'Autonomous Workflows',
    resources: {
      book: 'Designing Data-Intensive Applications',
      teacher: 'Krish Naik (Udemy/YT) / DeepLearning.AI'
    },
    sections: [
      {
        id: 'ai-p1',
        title: 'Phase 1: Prompt Engineering',
        tasks: [
          { id: 'ai-1-1', text: 'Chain-of-Thought (CoT)', isCompleted: false },
          { id: 'ai-1-2', text: 'Few-Shot & Zero-Shot Prompting', isCompleted: false },
          { id: 'ai-1-3', text: 'System Prompts for Agents', isCompleted: false },
        ]
      },
      {
        id: 'ai-p2',
        title: 'Phase 2: Function Calling & Tools',
        tasks: [
          { id: 'ai-2-1', text: 'OpenAI Function Calling', isCompleted: false },
          { id: 'ai-2-2', text: 'Building Tool Registries', isCompleted: false },
          { id: 'ai-2-3', text: 'Connecting Agents to APIs', isCompleted: false },
        ]
      },
      {
        id: 'ai-p3',
        title: 'Phase 3: RAG Systems',
        tasks: [
          { id: 'ai-3-1', text: 'Vector Databases (Pinecone/Chroma)', isCompleted: false },
          { id: 'ai-3-2', text: 'Embeddings & Semantic Search', isCompleted: false },
          { id: 'ai-3-3', text: 'Building a Q&A System', isCompleted: false },
        ]
      },
      {
        id: 'ai-p6',
        title: 'Phase 6: Agent Frameworks',
        tasks: [
          { id: 'ai-6-1', text: 'LangChain: Chains & Memories', isCompleted: false },
          { id: 'ai-6-2', text: 'LangGraph: State Management', isCompleted: false },
          { id: 'ai-6-3', text: 'CrewAI: Multi-Agent Orchestration', isCompleted: false },
        ]
      },
      {
        id: 'ai-p10',
        title: 'Phase 10: Vibe Coding',
        tasks: [
          { id: 'ai-10-1', text: 'Cursor IDE Workflow', isCompleted: false },
          { id: 'ai-10-2', text: 'AI-Native Development', isCompleted: false },
          { id: 'ai-10-3', text: 'Iterative Refinement with LLMs', isCompleted: false },
        ]
      }
    ]
  },
  {
    id: 'soft-skills',
    title: '6. Soft Skills',
    description: 'Makes you interview-ready. 50% of hiring decision.',
    iconName: 'Users',
    phase: 'Phase 3',
    examDate: '17 June - 17 July',
    strategy: 'Feedback - Adjust - Improve',
    mindset: 'STAR Method',
    resources: {
      book: 'How to Win Friends & Influence People',
      teacher: 'Alexander Lyon (YT)'
    },
    sections: [
      {
        id: 'ss-p1',
        title: 'Phase 1: Communication Skills',
        tasks: [
          { id: 'ss-1-1', text: 'Clarity & Conciseness (No jargon)', isCompleted: false },
          { id: 'ss-1-2', text: 'Active Listening', isCompleted: false },
          { id: 'ss-1-3', text: 'Body Language & Tone Analysis', isCompleted: false },
        ]
      },
      {
        id: 'ss-p2',
        title: 'Phase 2: Emotional Intelligence',
        tasks: [
          { id: 'ss-2-1', text: 'Self-Awareness & Triggers', isCompleted: false },
          { id: 'ss-2-2', text: 'Empathy in Engineering', isCompleted: false },
          { id: 'ss-2-3', text: 'Handling Criticism', isCompleted: false },
        ]
      },
      {
        id: 'ss-found',
        title: 'STAR Method Framework',
        tasks: [
          { id: 'ss-f-1', text: 'Situation, Task, Action, Result', isCompleted: false },
          { id: 'ss-f-2', text: 'Write 10 STAR stories', isCompleted: false },
          { id: 'ss-f-3', text: 'Practice Delivery (Recorded)', isCompleted: false },
        ]
      },
      {
        id: 'ss-p10',
        title: 'Phase 10: Interview Performance',
        tasks: [
          { id: 'ss-10-1', text: 'Mock Interviews (Pramp/Interviewing.io)', isCompleted: false },
          { id: 'ss-10-2', text: 'Handling Behavioral Questions', isCompleted: false },
          { id: 'ss-10-3', text: 'Asking Good Questions to Interviewers', isCompleted: false },
        ]
      }
    ]
  },
  {
    id: 'master-progress',
    title: '7. Master Progress',
    description: 'Ensures nothing is left behind. Discipline + Measurement.',
    iconName: 'Activity',
    phase: 'Continuous',
    examDate: 'Weekly',
    strategy: 'Discipline + Measurement',
    mindset: 'Weekly Metrics Dashboard',
    resources: {
      book: 'Atomic Habits',
      teacher: 'James Clear'
    },
    sections: [
      {
        id: 'mp-routine',
        title: 'Daily Routine Template',
        tasks: [
          { id: 'mr-1', text: 'Morning: Meditation + Exercise + Deep Work', isCompleted: false },
          { id: 'mr-2', text: 'Afternoon: Review Notes + Practice', isCompleted: false },
          { id: 'mr-3', text: 'Night: Journal + Gratitude', isCompleted: false },
        ]
      },
      {
        id: 'mp-review',
        title: 'Weekly Review',
        tasks: [
          { id: 'mrev-1', text: 'Track Hours Studied', isCompleted: false },
          { id: 'mrev-2', text: 'Identify Weak Areas', isCompleted: false },
          { id: 'mrev-3', text: 'Plan Next Week', isCompleted: false },
        ]
      }
    ]
  },
  {
    id: 'life-skills',
    title: '8. Life Skills',
    description: 'Thinking, Time, Comm, Finance, Relationships, Health, Learning.',
    iconName: 'Heart',
    phase: 'Combined Exam: 17 Sep',
    examDate: '17 September',
    resources: {
      book: 'Consolidated List (See Sections)',
      teacher: 'Various'
    },
    sections: [
      {
        id: 'ls-think',
        title: 'Thinking Skill (Critical Thinking)',
        tasks: [
          { id: 'lst-1', text: 'Level 1: Identify Assumptions & Bias', isCompleted: false },
          { id: 'lst-2', text: 'Level 2: Decision Matrix & Pros/Cons', isCompleted: false },
          { id: 'lst-3', text: 'Level 3: Logical Fallacies & Synthesizing', isCompleted: false },
        ]
      },
      {
        id: 'ls-time',
        title: 'Time Management',
        tasks: [
          { id: 'lsti-1', text: 'Level 1: Audit Time & Set Goals', isCompleted: false },
          { id: 'lsti-2', text: 'Level 2: Time Blocking & Prioritization', isCompleted: false },
          { id: 'lsti-3', text: 'Level 3: 80/20 Rule & Energy Mgmt', isCompleted: false },
        ]
      },
      {
        id: 'ls-fin',
        title: 'Finance Management',
        tasks: [
          { id: 'lsf-1', text: 'Level 1: Track Spending & Budgeting', isCompleted: false },
          { id: 'lsf-2', text: 'Level 2: Emergency Fund & Debt Plan', isCompleted: false },
          { id: 'lsf-3', text: 'Level 3: Investing & Financial Independence', isCompleted: false },
        ]
      },
      {
        id: 'ls-rel',
        title: 'Relationships',
        tasks: [
          { id: 'lsr-1', text: 'Level 1: Emotional Vocabulary & Awareness', isCompleted: false },
          { id: 'lsr-2', text: 'Level 2: Empathy & Conflict Resolution', isCompleted: false },
          { id: 'lsr-3', text: 'Level 3: Negotiation & Boundaries', isCompleted: false },
        ]
      },
      {
        id: 'ls-health',
        title: 'Health Management',
        tasks: [
          { id: 'lsh-1', text: 'Level 1: Sleep, Hydration, Movement', isCompleted: false },
          { id: 'lsh-2', text: 'Level 2: Nutrition & Exercise Routine', isCompleted: false },
          { id: 'lsh-3', text: 'Level 3: Peak Performance & Mental Health', isCompleted: false },
        ]
      }
    ]
  },
  {
    id: 'must-have',
    title: '9. Must Have Skills',
    description: 'Personal Branding & Product Management.',
    iconName: 'Zap',
    phase: 'Phase 4',
    examDate: '17 July - 17 August',
    strategy: 'Deep Dive',
    mindset: 'Complete Product Journey',
    resources: {
      book: 'Brand Called You / Inspired',
      teacher: 'Fireship / Product School'
    },
    sections: [
      {
        id: 'mh-pb',
        title: 'Personal Branding (6-Month Roadmap)',
        tasks: [
          { id: 'pb-1', text: 'Phase 1: Self-Discovery (UVP)', isCompleted: false },
          { id: 'pb-2', text: 'Phase 2: Content Strategy (Pillars)', isCompleted: false },
          { id: 'pb-3', text: 'Phase 3: Build Profiles (GitHub/LinkedIn)', isCompleted: false },
          { id: 'pb-4', text: 'Phase 4: Content Creation (Video/Blog)', isCompleted: false },
          { id: 'pb-5', text: 'Phase 5: Build Audience (Community)', isCompleted: false },
          { id: 'pb-6', text: 'Phase 6: Monetization', isCompleted: false },
        ]
      },
      {
        id: 'mh-pm',
        title: 'Product Management A-Z',
        tasks: [
          { id: 'pm-1', text: 'Phase 0: Ideation & Problem Validation', isCompleted: false },
          { id: 'pm-2', text: 'Phase 1-2: Development & Branding', isCompleted: false },
          { id: 'pm-3', text: 'Phase 3: Product-Market Fit (Beta)', isCompleted: false },
          { id: 'pm-4', text: 'Phase 4: GTM Strategy', isCompleted: false },
          { id: 'pm-5', text: 'Phase 5: Launch & Initial Growth', isCompleted: false },
          { id: 'pm-6', text: 'Phase 6-8: Scaling & Sustainability', isCompleted: false },
        ]
      }
    ]
  }
];
