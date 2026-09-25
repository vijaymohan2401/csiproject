var questions = [];
var index = 0;
var scores = {}; // Object to store scores for each set

function getApiBase() {
  return window.location.origin;
}

async function startQuiz() {
  await fetchQuestions();
}

async function fetchQuestions() {
  let url = `${getApiBase()}/random-questions`;
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const testInput = document.getElementById("testname");
  const test = testInput ? testInput.value : (user.collegeCode || "");
  
  if (test) {
    url = `${getApiBase()}/random-questions?college=${test}`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    questions = data || [];
    index = 0;
    scores = {};
    renderQuestion();
  } catch (error) {
    console.error('Error fetching questions:', error);
    // Fallback standard DASS-21 sample questions
    questions = [
      { text: "I found it hard to wind down and relax after classes.", set: "Stress", options: ["Did not apply to me at all", "Applied to me to some degree", "Applied to me to a considerable degree", "Applied to me very much"], scores: [0, 1, 2, 3] },
      { text: "I was aware of dryness of my mouth or physical tension when facing assignments.", set: "Anxiety", options: ["Did not apply to me at all", "Applied to me to some degree", "Applied to me to a considerable degree", "Applied to me very much"], scores: [0, 1, 2, 3] },
      { text: "I couldn't seem to experience any positive feeling at all.", set: "Depression", options: ["Did not apply to me at all", "Applied to me to some degree", "Applied to me to a considerable degree", "Applied to me very much"], scores: [0, 1, 2, 3] },
      { text: "I experienced breathing difficulty or rapid heart rate without physical exertion.", set: "Anxiety", options: ["Did not apply to me at all", "Applied to me to some degree", "Applied to me to a considerable degree", "Applied to me very much"], scores: [0, 1, 2, 3] },
      { text: "I found it difficult to work up the initiative to study or complete lab reports.", set: "Depression", options: ["Did not apply to me at all", "Applied to me to some degree", "Applied to me to a considerable degree", "Applied to me very much"], scores: [0, 1, 2, 3] },
      { text: "I tended to over-react to unexpected academic situations.", set: "Stress", options: ["Did not apply to me at all", "Applied to me to some degree", "Applied to me to a considerable degree", "Applied to me very much"], scores: [0, 1, 2, 3] },
      { text: "I felt that I was using a lot of nervous energy during daily tasks.", set: "Stress", options: ["Did not apply to me at all", "Applied to me to some degree", "Applied to me to a considerable degree", "Applied to me very much"], scores: [0, 1, 2, 3] }
    ];
    renderQuestion();
  }
}

function renderQuestion() {
  const appDiv = document.getElementById('app');
  if (!appDiv) return;

  if (!questions || questions.length === 0 || index >= questions.length) {
    showResults();
    return;
  }

  const currentQuestion = questions[index];
  const progressPercent = Math.round(((index + 1) / questions.length) * 100);

  appDiv.innerHTML = `
    <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 18px; padding: 2rem; backdrop-filter: blur(16px); box-shadow: var(--shadow-lg);">
      <!-- Progress Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <span style="font-size: 0.85rem; font-weight: 700; color: #818cf8; text-transform: uppercase;">
          Question ${index + 1} of ${questions.length} • ${currentQuestion.set || "Stress"}
        </span>
        <span style="font-size: 0.85rem; color: #94a3b8; font-weight: 600;">${progressPercent}% Complete</span>
      </div>
      <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.06); border-radius: 9999px; margin-bottom: 2rem; overflow: hidden;">
        <div style="width: ${progressPercent}%; height: 100%; background: var(--gradient-primary); transition: width 0.3s ease;"></div>
      </div>

      <!-- Question Title -->
      <h3 style="font-size: 1.35rem; color: #ffffff; line-height: 1.5; margin-bottom: 1.75rem;">
        ${currentQuestion.text}
      </h3>

      <!-- Likert Scale Options -->
      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 1.75rem;">
        ${currentQuestion.options.map((option, i) => `
          <button type="button" 
                  onclick="handleOptionClick(${i}, ${currentQuestion.scores[i]}, '${currentQuestion.set || "Stress"}')"
                  style="display: flex; align-items: center; gap: 14px; padding: 14px 18px; background: rgba(255,255,255,0.04); border: 1px solid var(--border-subtle); border-radius: 12px; color: #e2e8f0; font-size: 0.95rem; font-family: inherit; text-align: left; cursor: pointer; transition: all 0.2s ease;"
                  onmouseover="this.style.background='rgba(99,102,241,0.15)'; this.style.borderColor='rgba(99,102,241,0.4)';"
                  onmouseout="this.style.background='rgba(255,255,255,0.04)'; this.style.borderColor='var(--border-subtle)';">
            <span style="width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; color: #818cf8; flex-shrink: 0;">
              ${String.fromCharCode(65 + i)}
            </span>
            <span style="flex-grow: 1;">${option}</span>
          </button>
        `).join('')}
      </div>

      <div style="font-size: 0.8rem; color: #64748b; text-align: center;">
        Select the option that best reflects your feelings over the past 7 days.
      </div>
    </div>
  `;
}

function handleOptionClick(optionIndex, score, set) {
  if (!scores[set]) {
    scores[set] = 0;
  }
  scores[set] += score;
  index++;

  if (index < questions.length) {
    renderQuestion();
  } else {
    showResults();
  }
}

function getSeverityBadge(score, set) {
  // Clinical DASS-21 Thresholds
  let severity = "Normal";
  let color = "#10b981";
  let bg = "rgba(16,185,129,0.15)";
  let border = "rgba(16,185,129,0.3)";

  if (set === "Stress") {
    if (score >= 17) { severity = "Severe"; color = "#f43f5e"; bg = "rgba(244,63,94,0.15)"; border = "rgba(244,63,94,0.3)"; }
    else if (score >= 13) { severity = "Moderate"; color = "#f59e0b"; bg = "rgba(245,158,11,0.15)"; border = "rgba(245,158,11,0.3)"; }
    else if (score >= 8) { severity = "Mild"; color = "#38bdf8"; bg = "rgba(56,189,248,0.15)"; border = "rgba(56,189,248,0.3)"; }
  } else if (set === "Anxiety") {
    if (score >= 10) { severity = "Severe"; color = "#f43f5e"; bg = "rgba(244,63,94,0.15)"; border = "rgba(244,63,94,0.3)"; }
    else if (score >= 8) { severity = "Moderate"; color = "#f59e0b"; bg = "rgba(245,158,11,0.15)"; border = "rgba(245,158,11,0.3)"; }
    else if (score >= 4) { severity = "Mild"; color = "#38bdf8"; bg = "rgba(56,189,248,0.15)"; border = "rgba(56,189,248,0.3)"; }
  } else {
    if (score >= 14) { severity = "Severe"; color = "#f43f5e"; bg = "rgba(244,63,94,0.15)"; border = "rgba(244,63,94,0.3)"; }
    else if (score >= 10) { severity = "Moderate"; color = "#f59e0b"; bg = "rgba(245,158,11,0.15)"; border = "rgba(245,158,11,0.3)"; }
    else if (score >= 5) { severity = "Mild"; color = "#38bdf8"; bg = "rgba(56,189,248,0.15)"; border = "rgba(56,189,248,0.3)"; }
  }

  return `<span style="background:${bg}; color:${color}; border:1px solid ${border}; padding:4px 10px; border-radius:9999px; font-size:0.75rem; font-weight:700; text-transform:uppercase;">${severity}</span>`;
}

function showResults() {
  const appDiv = document.getElementById('app');
  if (!appDiv) return;

  const uid = localStorage.getItem("uid") || "stu_001";
  saveResults(scores, uid);

  appDiv.innerHTML = `
    <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 18px; padding: 2.5rem; backdrop-filter: blur(16px); box-shadow: var(--shadow-lg); text-align: center;">
      <div style="width: 72px; height: 72px; border-radius: 50%; background: rgba(16,185,129,0.15); color: #10b981; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin: 0 auto 1.25rem; border: 1px solid rgba(16,185,129,0.3);">
        ✓
      </div>
      <h2 style="font-size: 1.85rem; color: #fff; margin-bottom: 0.5rem;">Assessment Completed!</h2>
      <p style="color: var(--text-muted); max-width: 580px; margin: 0 auto 2rem; font-size: 0.95rem;">
        Here is your clinical DASS-21 diagnostic summary. Your results have been securely recorded into your wellness profile.
      </p>

      <!-- Results Scorecards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2.25rem;">
        ${Object.entries(scores).map(([set, score]) => `
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 1.25rem; display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <span style="font-size: 0.85rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">${set} Scale</span>
            <span style="font-size: 2.2rem; font-weight: 800; color: #ffffff;">${score}</span>
            ${getSeverityBadge(score, set)}
          </div>
        `).join('')}
      </div>

      <!-- Recommended Action Plan -->
      <div style="background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.25); border-radius: 14px; padding: 1.5rem; text-align: left; margin-bottom: 2rem;">
        <h4 style="color: #fff; margin-top: 0; margin-bottom: 0.5rem; font-size: 1.05rem;">
          💡 Personalized Coping Prescription:
        </h4>
        <p style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.6; margin: 0 0 1rem;">
          To mitigate autonomic nervous system activation, practice <strong>Box Breathing</strong> or <strong>5-4-3-2-1 Sensory Grounding</strong> for at least 5 minutes daily. If your stress levels feel overwhelming, consider a confidential session with a campus counselor.
        </p>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <a href="coping.html" class="serene-btn-primary" style="text-decoration: none; padding: 0.55rem 1.2rem; font-size: 0.88rem;">
            <i class="fa fa-spa"></i> Practice Coping Tools
          </a>
          <a href="groups.html" style="display: inline-flex; align-items: center; gap: 6px; padding: 0.55rem 1.2rem; background: rgba(255,255,255,0.06); border: 1px solid var(--border-subtle); border-radius: 9999px; color: #fff; font-size: 0.88rem; text-decoration: none;">
            <i class="fa fa-user-doctor"></i> Book Counselor Session
          </a>
        </div>
      </div>

      <a href="index.html" class="serene-btn-primary" style="text-decoration: none;">
        <i class="fa fa-house"></i> Return to Dashboard
      </a>
    </div>
  `;
}

function saveResults(results, uid) {
  fetch(`${getApiBase()}/saveSelfTestResults`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ results, uid })
  })
  .then(res => res.json())
  .then(data => console.log('Self-test saved:', data))
  .catch(err => console.error('Error saving self-test:', err));
}
