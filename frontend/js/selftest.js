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
    <div style="background: #ffffff; border: 1px solid #bae6fd; border-radius: 20px; padding: 2.25rem; box-shadow: 0 10px 25px -5px rgba(2,132,199,0.08);">
      <!-- Progress Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <span style="font-size: 0.85rem; font-weight: 700; color: #0284c7; text-transform: uppercase; letter-spacing: 0.04em;">
          Question ${index + 1} of ${questions.length} • ${currentQuestion.set || "Stress"}
        </span>
        <span style="font-size: 0.85rem; color: #0284c7; font-weight: 700;">${progressPercent}% Complete</span>
      </div>
      <div style="width: 100%; height: 8px; background: #e0f2fe; border-radius: 9999px; margin-bottom: 2rem; overflow: hidden;">
        <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #0284c7 0%, #10b981 100%); transition: width 0.35s ease;"></div>
      </div>

      <!-- Question Title -->
      <h3 style="font-size: 1.35rem; color: #0c4a6e; font-weight: 700; line-height: 1.5; margin-bottom: 1.75rem;">
        ${currentQuestion.text}
      </h3>

      <!-- Likert Scale Options -->
      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 1.75rem;">
        ${currentQuestion.options.map((option, i) => `
          <button type="button" 
                  onclick="handleOptionClick(${i}, ${currentQuestion.scores[i]}, '${currentQuestion.set || "Stress"}')"
                  style="display: flex; align-items: center; gap: 14px; padding: 14px 18px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; color: #1e293b; font-size: 0.95rem; font-family: inherit; font-weight: 500; text-align: left; cursor: pointer; transition: all 0.2s ease;"
                  onmouseover="this.style.background='#f0f9ff'; this.style.borderColor='#38bdf8'; this.style.transform='translateX(4px)';"
                  onmouseout="this.style.background='#f8fafc'; this.style.borderColor='#e2e8f0'; this.style.transform='translateX(0)';">
            <span style="width: 30px; height: 30px; border-radius: 50%; background: #e0f2fe; border: 1px solid #bae6fd; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.82rem; color: #0284c7; flex-shrink: 0;">
              ${String.fromCharCode(65 + i)}
            </span>
            <span style="flex-grow: 1;">${option}</span>
          </button>
        `).join('')}
      </div>

      <div style="font-size: 0.82rem; color: #64748b; text-align: center;">
        🌿 Take your time — choose the option that reflects your thoughts over the past 7 days.
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
  let color = "#059669";
  let bg = "#ecfdf5";
  let border = "#a7f3d0";

  if (set === "Stress") {
    if (score >= 17) { severity = "Severe"; color = "#b91c1c"; bg = "#fef2f2"; border = "#fecaca"; }
    else if (score >= 13) { severity = "Moderate"; color = "#c2410c"; bg = "#fff7ed"; border = "#fed7aa"; }
    else if (score >= 8) { severity = "Mild"; color = "#0369a1"; bg = "#f0f9ff"; border = "#bae6fd"; }
  } else if (set === "Anxiety") {
    if (score >= 10) { severity = "Severe"; color = "#b91c1c"; bg = "#fef2f2"; border = "#fecaca"; }
    else if (score >= 8) { severity = "Moderate"; color = "#c2410c"; bg = "#fff7ed"; border = "#fed7aa"; }
    else if (score >= 4) { severity = "Mild"; color = "#0369a1"; bg = "#f0f9ff"; border = "#bae6fd"; }
  } else {
    if (score >= 14) { severity = "Severe"; color = "#b91c1c"; bg = "#fef2f2"; border = "#fecaca"; }
    else if (score >= 10) { severity = "Moderate"; color = "#c2410c"; bg = "#fff7ed"; border = "#fed7aa"; }
    else if (score >= 5) { severity = "Mild"; color = "#0369a1"; bg = "#f0f9ff"; border = "#bae6fd"; }
  }

  return `<span style="background:${bg}; color:${color}; border:1px solid ${border}; padding:4px 12px; border-radius:9999px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.04em;">${severity}</span>`;
}

function showResults() {
  const appDiv = document.getElementById('app');
  if (!appDiv) return;

  const uid = localStorage.getItem("uid") || "stu_001";
  saveResults(scores, uid);

  appDiv.innerHTML = `
    <div style="background: #ffffff; border: 1px solid #bae6fd; border-radius: 20px; padding: 2.75rem 2rem; box-shadow: 0 10px 25px -5px rgba(2,132,199,0.08); text-align: center;">
      <div style="width: 76px; height: 76px; border-radius: 50%; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 2.4rem; margin: 0 auto 1.25rem; border: 1.5px solid #a7f3d0;">
        ✓
      </div>
      <h2 style="font-size: 1.85rem; color: #0c4a6e; font-weight: 800; margin-bottom: 0.5rem;">Assessment Completed!</h2>
      <p style="color: #64748b; max-width: 580px; margin: 0 auto 2rem; font-size: 0.95rem; line-height: 1.6;">
        Here is your clinical DASS-21 summary. Your scores have been securely saved to guide your personal stress management journey.
      </p>

      <!-- Results Scorecards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2.25rem;">
        ${Object.entries(scores).map(([set, score]) => `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.25rem; display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em;">${set} Scale</span>
            <span style="font-size: 2.4rem; font-weight: 800; color: #0c4a6e;">${score}</span>
            ${getSeverityBadge(score, set)}
          </div>
        `).join('')}
      </div>

      <!-- Recommended Action Plan -->
      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfeff 50%, #fff7ed 100%); border: 1px solid #a7f3d0; border-radius: 16px; padding: 1.5rem; text-align: left; margin-bottom: 2rem;">
        <h4 style="color: #065f46; font-weight: 700; margin-top: 0; margin-bottom: 0.5rem; font-size: 1.05rem;">
          💡 Personalized Coping Prescription
        </h4>
        <p style="color: #334155; font-size: 0.92rem; line-height: 1.6; margin: 0 0 1.2rem;">
          To gently soothe your nervous system, practice <strong>Box Breathing</strong> or <strong>5-4-3-2-1 Sensory Grounding</strong> for at least 5 minutes today. If you need confidential guidance, our university counselors are here to listen.
        </p>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <a href="coping.html" class="serene-btn-primary" style="text-decoration: none; padding: 0.6rem 1.4rem; font-size: 0.9rem;">
            <i class="fa fa-spa"></i> Practice Coping Tools
          </a>
          <a href="groups.html" style="display: inline-flex; align-items: center; gap: 8px; padding: 0.6rem 1.4rem; background: #ffffff; border: 1.5px solid #bae6fd; border-radius: 9999px; color: #0284c7; font-weight: 700; font-size: 0.9rem; text-decoration: none; transition: all 0.2s ease;">
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
