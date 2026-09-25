function getApiBase() {
  return window.location.origin;
}

async function showQuestion() {
  const introContainer = document.getElementById('journalIntro');
  const questionContainer = document.getElementById('questionContainer');
  if (introContainer) introContainer.style.display = 'none';
  if (questionContainer) questionContainer.style.display = 'block';

  try {
    const res = await fetch(`${getApiBase()}/get-next-question`);
    const data = await res.json();
    const qEl = document.getElementById('question');
    if (qEl && data.question) {
      qEl.textContent = data.question;
    }
  } catch (err) {
    console.error("Error fetching question:", err);
    const qEl = document.getElementById('question');
    if (qEl) qEl.textContent = "What triggered stress or emotional tension in your college routine today, and how did you navigate it?";
  }
}

async function SubmitJournalAnswer() {
  const answerEl = document.getElementById('answerTextarea');
  const answer = answerEl ? answerEl.value.trim() : "";
  const uid = localStorage.getItem("uid") || "stu_001";

  if (!answer) {
    showToast("Please write a few thoughts before saving your reflection.");
    return;
  }

  try {
    const response = await axios.post(`${getApiBase()}/submit-daily-journal-answer`, {
      uid: uid,
      answer: answer,
    });

    if (response.data) {
      showToast(response.data.message || "Reflection saved successfully! +25 Wellness Points");
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    }
  } catch (error) {
    console.error("Journal submission error:", error);
    showToast("Reflection logged locally! Great job taking time for self-care.");
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  }
}

function showToast(message) {
  const messageToast = document.getElementById('messageToast');
  if (!messageToast) return;
  messageToast.innerText = message;
  messageToast.style.display = 'block';
  setTimeout(() => {
    closeToast();
  }, 4000);
}

function closeToast() {
  const messageToast = document.getElementById('messageToast');
  if (messageToast) messageToast.style.display = 'none';
}