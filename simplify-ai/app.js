/**
 * Simplify AI - Core Logic & Prompt Engine
 */

(function () {
  'use strict';

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // DOM Elements
  const navBrand = document.getElementById('nav-brand');
  const viewDashboard = document.getElementById('view-dashboard');
  const viewOfficeReport = document.getElementById('view-office-report');
  const cardOfficeReport = document.getElementById('card-office-report');
  const btnBackDashboard = document.getElementById('btn-back-dashboard');

  const empNameInput = document.getElementById('emp-name');
  const empDeptInput = document.getElementById('emp-dept');
  const reportDateInput = document.getElementById('report-date');
  const dateDisplay = document.getElementById('date-display');
  const btnCopyPrompt = document.getElementById('btn-copy-prompt');

  // --- Date Formatting ---
  function getFormattedDate() {
    if (!reportDateInput.value) {
      const now = new Date();
      return `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    }
    const parts = reportDateInput.value.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return `${day} ${MONTHS[month]} ${year}`;
    }
    const now = new Date();
    return `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  }

  function setTodayDate() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    reportDateInput.value = `${y}-${m}-${d}`;
  }

  function updateDateDisplay() {
    dateDisplay.textContent = getFormattedDate();
  }

  // --- Master Prompt Generator ---
  function generateGeminiPrompt() {
    const name = empNameInput.value.trim() || 'VISHVAS VAID';
    const dept = empDeptInput.value || 'Sales & Operations';
    const dateStr = getFormattedDate();

    return `Act as an expert Corporate Technical Writer and Office Report Generator.

I will tell you about my daily work. I might type or speak (using voice audio) in very raw, casual, unstructured, or broken language (slang, rough bullet points, typos, or spoken Hindi/English mixture).

YOUR TASK:
Use your AI knowledge to understand whatever rough or broken language I give you, clean up all errors, professionalize the phrasing with appropriate technical terminology for the ${dept} department, and output my daily office report in this EXACT standardized format.

### ⚠️ STRICT OUTPUT RULES:
1. Output ONLY the completed report. DO NOT output any introductory text, greetings, explanations, or closing remarks (NO "Here is your report", NO "Sure thing", NO "Hope this helps").
2. DO NOT wrap the output in markdown code blocks (\`\`\` or \`\`\`markdown). Output as raw formatted markdown directly.
3. Every header line must be enclosed in asterisks:
   *Name: ${name}*
   *Department: ${dept}*
   *Date: ${dateStr}*
4. Include exactly these 4 section titles wrapped in single asterisks:
   *Targets*
   *Work Completed*
   *Results*
   *Pending Tasks*
5. Every bullet point under every section MUST start with an asterisk followed by a space (\`* \`).
6. Content Organization:
   - *Targets*: 3 to 4 clear, professional objectives based on what was worked on.
   - *Work Completed*: Tasks completed today with strong action verbs (e.g., Investigated, Implemented, Updated, Configured, Reviewed, Inspected, Resolved, Coordinated, Executed).
   - *Results*: Verified outcomes, measurable achievements, or error-free status.
   - *Pending Tasks*: Leftover tasks or planned next steps for tomorrow.

### EXACT FORMAT TEMPLATE TO FOLLOW:
*Name: ${name}*
*Department: ${dept}*
*Date: ${dateStr}*

*Targets*
* [Target 1]
* [Target 2]
* [Target 3]

*Work Completed*
* [Work completed 1]
* [Work completed 2]
* [Work completed 3]

*Results*
* [Result 1]
* [Result 2]

*Pending Tasks*
* [Pending task 1]
* [Pending task 2]

---
Acknowledge by replying ONLY with:
"Ready! Tell or speak your daily work, and I will generate your office report in exact format."
Then, for every message I send, output ONLY the report in the exact format above.`;
  }

  // --- Toast Notification ---
  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.innerHTML = `
      <div class="flex-1 text-xs sm:text-sm font-semibold text-white">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3000);
  }

  // --- Copy to Clipboard ---
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      showToast('📋 Prompt copied to clipboard!');
      return true;
    } catch (err) {
      console.error(err);
      showToast('Copied to clipboard!');
      return false;
    }
  }

  // --- View Switcher ---
  function showView(viewId) {
    if (viewId === 'office-report') {
      viewDashboard.classList.add('view-hidden');
      viewOfficeReport.classList.remove('view-hidden');
    } else {
      viewOfficeReport.classList.add('view-hidden');
      viewDashboard.classList.remove('view-hidden');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Storage ---
  function saveToStorage() {
    try {
      localStorage.setItem('simplify_ai_name', empNameInput.value);
      localStorage.setItem('simplify_ai_dept', empDeptInput.value);
    } catch (e) {}
  }

  function loadFromStorage() {
    try {
      const name = localStorage.getItem('simplify_ai_name');
      const dept = localStorage.getItem('simplify_ai_dept');
      if (name) empNameInput.value = name;
      if (dept) empDeptInput.value = dept;
    } catch (e) {}
  }

  // --- Event Listeners ---
  function initListeners() {
    // Navigation
    cardOfficeReport.addEventListener('click', () => {
      if (navigator.vibrate) navigator.vibrate(20);
      showView('office-report');
    });

    btnBackDashboard.addEventListener('click', () => {
      if (navigator.vibrate) navigator.vibrate(20);
      showView('dashboard');
    });

    navBrand.addEventListener('click', () => {
      if (navigator.vibrate) navigator.vibrate(20);
      showView('dashboard');
    });

    // Input changes
    empNameInput.addEventListener('input', () => {
      saveToStorage();
    });

    empDeptInput.addEventListener('change', () => {
      saveToStorage();
    });

    reportDateInput.addEventListener('change', () => {
      updateDateDisplay();
    });

    // Action Button: Copy Prompt
    btnCopyPrompt.addEventListener('click', async () => {
      if (navigator.vibrate) navigator.vibrate(40);
      const prompt = generateGeminiPrompt();
      await copyText(prompt);
    });
  }

  // --- Init ---
  function init() {
    setTodayDate();
    loadFromStorage();
    updateDateDisplay();
    initListeners();
    showView('office-report');

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
