/**
 * PsyShell - College Stress Levels & Coping Mechanisms Dashboard Logic
 */

// Ensure Collegecode defaults to COL001 if opening directly
if (!localStorage.getItem("Collegecode")) {
  localStorage.setItem("Collegecode", "COL001");
}

var graphdata = null;
var students = [];
var doctorsData = [];
let moodChart = null;
let deptChart = null;
let ageChart = null;
let stressDistChart = null;
let copingAdoptChart = null;
var query = getParams();

// Refresh list listener
document.getElementById("refresh-list")?.addEventListener("click", () => {
  localStorage.removeItem("students");
  localStorage.removeItem("doctorsData");
  fetchData();
});

async function fetchData() {
  try {
    if (localStorage.getItem("students")) {
      students = JSON.parse(localStorage.getItem("students"));
    } else {
      students = await fetchStudentsByCollege();
      localStorage.setItem("students", JSON.stringify(students));
    }

    // Update Top Overview KPIs and Visual Analytics
    renderExecutiveKPIs(students);
    renderVisualCharts(students);

    // Display Student Registry Table
    displayStudents(students);
    addClickEventListeners();

    // Auto-select first student or student from URL query
    if (query["uid"]) {
      selectStudentByUid(query["uid"]);
    } else if (students.length > 0) {
      selectStudentByUid(students[0].uid);
    }
  } catch (error) {
    console.error("Error fetching student data:", error);
  }
}

fetchData();

async function fetchStudentsByCollege() {
  let code = localStorage.getItem("Collegecode") || "COL001";
  const response = await axios.post(
    "http://localhost:8000/get-students-by-college",
    { code: code },
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data.students || [];
}

// ----------------- EXECUTIVE SUMMARY & KPI CARDS -----------------

function renderExecutiveKPIs(studentsList) {
  const total = studentsList.length;
  let highStressCount = 0;
  const copingMap = {};

  studentsList.forEach((s) => {
    const details = s.details.fulldetails || {};
    const level = details.stressLevel || "Moderate";
    if (level === "High" || level === "Severe") {
      highStressCount++;
    }
    const coping = (details.copingTechnique || "Box Breathing").split("&")[0].trim();
    copingMap[coping] = (copingMap[coping] || 0) + 1;
  });

  // Top coping mechanism
  let topCoping = "Box Breathing";
  let maxCount = 0;
  for (const [k, v] of Object.entries(copingMap)) {
    if (v > maxCount) {
      maxCount = v;
      topCoping = k;
    }
  }

  const kpiTotal = document.getElementById("kpi-total-students");
  if (kpiTotal) kpiTotal.textContent = `${total} Active`;

  const kpiHigh = document.getElementById("kpi-high-stress");
  if (kpiHigh) kpiHigh.textContent = `${highStressCount} Students`;

  const kpiCoping = document.getElementById("kpi-top-coping");
  if (kpiCoping) kpiCoping.textContent = topCoping;
}

// ----------------- OVERVIEW CHARTS -----------------

function renderVisualCharts(studentsList) {
  const ageAnalytics = {};
  const deptAnalytics = {};
  const stressDist = { "Low": 0, "Moderate": 0, "High": 0, "Severe": 0 };
  const copingMap = {};

  studentsList.forEach((student) => {
    const details = student.details.fulldetails || {};
    const age = details.age || 20;
    const dept = details.dept || "General";
    const sLevel = details.stressLevel || "Moderate";
    const cTech = (details.copingTechnique || "Box Breathing").split("&")[0].trim();

    ageAnalytics[age] = (ageAnalytics[age] || 0) + 1;
    deptAnalytics[dept] = (deptAnalytics[dept] || 0) + 1;
    stressDist[sLevel] = (stressDist[sLevel] || 0) + 1;
    copingMap[cTech] = (copingMap[cTech] || 0) + 1;
  });

  // 1. Campus Stress Severity Distribution (Doughnut)
  const stressCanvas = document.getElementById("stressDistributionChart");
  if (stressCanvas) {
    if (stressDistChart) stressDistChart.destroy();
    stressDistChart = new Chart(stressCanvas, {
      type: "doughnut",
      data: {
        labels: ["Low Stress", "Moderate", "High Stress", "Severe Stress"],
        datasets: [{
          data: [stressDist["Low"], stressDist["Moderate"], stressDist["High"], stressDist["Severe"]],
          backgroundColor: ["#10b981", "#f59e0b", "#ef4444", "#7f1d1d"],
          borderWidth: 2,
          borderColor: "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 10 } } }
        }
      }
    });
  }

  // 2. Coping Mechanism Adoption (Horizontal Bar)
  const copingCanvas = document.getElementById("copingAdoptionChart");
  if (copingCanvas) {
    if (copingAdoptChart) copingAdoptChart.destroy();
    copingAdoptChart = new Chart(copingCanvas, {
      type: "bar",
      data: {
        labels: Object.keys(copingMap),
        datasets: [{
          label: "Students Practicing",
          data: Object.values(copingMap),
          backgroundColor: "rgba(99, 102, 241, 0.7)",
          borderColor: "#6366f1",
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } },
          y: { ticks: { font: { size: 10 } } }
        }
      }
    });
  }

  // 3. Students by Department (Bar)
  const deptCanvas = document.getElementById("deptCanvasChart");
  if (deptCanvas) {
    if (deptChart) deptChart.destroy();
    deptChart = new Chart(deptCanvas, {
      type: "bar",
      data: {
        labels: Object.keys(deptAnalytics).map(d => d.replace("Engineering", "Eng")),
        datasets: [{
          label: "Enrolled",
          data: Object.values(deptAnalytics),
          backgroundColor: "rgba(14, 165, 233, 0.7)",
          borderColor: "#0ea5e9",
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } },
          x: { ticks: { font: { size: 9 } } }
        }
      }
    });
  }

  // 4. Students by Age Group (Bar)
  const ageCanvas = document.getElementById("ageCanvasChart");
  if (ageCanvas) {
    if (ageChart) ageChart.destroy();
    ageChart = new Chart(ageCanvas, {
      type: "bar",
      data: {
        labels: Object.keys(ageAnalytics).map(a => `${a} yrs`),
        datasets: [{
          label: "Count",
          data: Object.values(ageAnalytics),
          backgroundColor: "rgba(168, 85, 247, 0.7)",
          borderColor: "#a855f7",
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } },
          x: { ticks: { font: { size: 10 } } }
        }
      }
    });
  }
}

// ----------------- STUDENT REGISTRY TABLE -----------------

let timeoutId;
const searchInput = document.getElementById("searchstudent");
if (searchInput) {
  searchInput.addEventListener("input", () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(filterStudents, 300);
  });
}

function filterStudents() {
  const searchText = (document.getElementById("searchstudent")?.value || "").toLowerCase().trim();

  const filtered = students.filter((student) => {
    const details = student.details.fulldetails || {};
    const name = (details.nickname || "").toLowerCase();
    const email = (details.email || "").toLowerCase();
    const dept = (details.dept || "").toLowerCase();
    const coping = (details.copingTechnique || "").toLowerCase();
    const stress = (details.stressLevel || "").toLowerCase();

    return (
      name.includes(searchText) ||
      email.includes(searchText) ||
      dept.includes(searchText) ||
      coping.includes(searchText) ||
      stress.includes(searchText)
    );
  });

  renderFilteredStudents(filtered);
  addClickEventListeners();
}

function displayStudents(studentsList) {
  renderFilteredStudents(studentsList);
}

function renderFilteredStudents(filteredStudents) {
  const tableBody = document.querySelector("#studentsTable tbody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  filteredStudents.forEach((student) => {
    const details = student.details.fulldetails || {};
    const name = details.nickname || "Student";
    const email = details.email || "";
    const dept = details.dept || "General";
    const uid = student.uid;
    const status = details.token;
    const stressLevel = details.stressLevel || "Moderate";
    const coping = details.copingTechnique ? details.copingTechnique.split("&")[0].trim() : "Box Breathing";

    let badgeClass = "badge-stress-mod";
    if (stressLevel === "Low") badgeClass = "badge-stress-low";
    else if (stressLevel === "High") badgeClass = "badge-stress-high";
    else if (stressLevel === "Severe") badgeClass = "badge-stress-severe";

    const row = `<tr data-uid="${uid}">
      <td>
        <strong style="color: #0f172a;">${name}</strong><br>
        <small class="text-muted">${email}</small>
      </td>
      <td>
        <span class="${badgeClass}">${stressLevel}</span>
      </td>
      <td>
        <span class="badge badge-light border" style="font-size: 0.8rem; padding: 4px 6px;">🧘 ${coping}</span>
      </td>
      <td><small style="color: #475569; font-weight: 600;">${dept}</small></td>
      <td>
        <span class="${status ? "text-success" : "text-muted"}" style="font-weight: 600; font-size: 0.82rem;">
          <i class="fa fa-circle" style="font-size: 8px;"></i> ${status ? "Active" : "Offline"}
        </span>
      </td>
    </tr>`;
    tableBody.insertAdjacentHTML("beforeend", row);
  });

  // Reinitialize DataTable without warnings
  if (window.jQuery && $.fn.DataTable) {
    if ($.fn.DataTable.isDataTable("#studentsTable")) {
      $("#studentsTable").DataTable().destroy();
    }
    $("#studentsTable").DataTable({
      searching: false,
      info: false,
      paging: true,
      pageLength: 6,
      lengthChange: false
    });
  }
}

function addClickEventListeners() {
  const tableBody = document.querySelector("#studentsTable tbody");
  if (!tableBody) return;

  tableBody.querySelectorAll("tr").forEach((row) => {
    row.addEventListener("click", function (event) {
      event.preventDefault();
      const uid = this.getAttribute("data-uid");
      if (uid) {
        selectStudentByUid(uid);
      }
    });
  });
}

function selectStudentByUid(uid) {
  const selectedstudent = students.find((s) => s.uid === uid);
  if (!selectedstudent) return;

  const details = selectedstudent.details.fulldetails || {};

  // Update Header Banner
  const avatar = document.getElementById("detailStudentAvatar");
  if (avatar) avatar.src = details.profile || "images/resources/defaultpic.jpg";

  const nameEl = document.getElementById("detailStudentName");
  if (nameEl) nameEl.textContent = details.nickname || "Student";

  const deptEl = document.getElementById("detailStudentDept");
  if (deptEl) deptEl.textContent = `${details.occupation || "Undergraduate"} &bull; ${details.dept || "General"} &bull; Age: ${details.age || 20}`;

  const badgeEl = document.getElementById("detailStudentStressBadge");
  if (badgeEl) {
    let bClass = "badge-stress-mod";
    if (details.stressLevel === "Low") bClass = "badge-stress-low";
    else if (details.stressLevel === "High") bClass = "badge-stress-high";
    else if (details.stressLevel === "Severe") bClass = "badge-stress-severe";

    badgeEl.innerHTML = `<span class="${bClass}" style="font-size: 0.95rem; padding: 6px 12px;">Level: ${details.stressLevel || "Moderate"}</span>`;
  }

  // Update Diagnostic Scorecard
  const scorecard = document.getElementById("stressScorecardGrid");
  if (scorecard) {
    scorecard.style.display = "block";
    const sScore = details.stressScore || 16;
    const aScore = details.anxietyScore || 12;
    const slScore = details.sleepScore || 10;
    const rPoints = details.resiliencePoints || 80;

    document.getElementById("scoreAcademicVal").textContent = `${sScore} / 30`;
    document.getElementById("scoreAcademicBar").style.width = `${Math.min(100, Math.round((sScore / 30) * 100))}%`;

    document.getElementById("scoreAnxietyVal").textContent = `${aScore} / 24`;
    document.getElementById("scoreAnxietyBar").style.width = `${Math.min(100, Math.round((aScore / 24) * 100))}%`;

    document.getElementById("scoreSleepVal").textContent = `${slScore} / 24`;
    document.getElementById("scoreSleepBar").style.width = `${Math.min(100, Math.round((slScore / 24) * 100))}%`;

    document.getElementById("scoreCopingName").textContent = details.copingTechnique || "Box Breathing & Journaling";
    document.getElementById("scorePointsVal").textContent = rPoints;
  }

  // Populate Details Table
  addDataToTable(details);

  // Fetch Analytics & Posts
  fetchAnalytics(uid);
  loadPosts(uid, 1, false);

  // Update URL history without reload
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set("uid", uid);
  window.history.replaceState({}, "", `${window.location.pathname}?${urlParams}#feature`);
}

function addDataToTable(data) {
  const tableBody = document.querySelector("#dataTable tbody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  const labelDict = {
    nickname: "Full Name",
    email: "Student Email",
    age: "Age",
    gender: "Gender",
    dept: "Academic Department",
    occupation: "Academic Year / Course",
    stressLevel: "Evaluated Stress Level",
    stressScore: "Academic Stress Score (Out of 30)",
    anxietyScore: "Exam & Presentation Anxiety (Out of 24)",
    sleepScore: "Sleep Quality Disruption Score (Out of 24)",
    copingTechnique: "Active Coping Mechanisms",
    resiliencePoints: "Campus Resilience Points",
    relationshipstatus: "Relationship Status"
  };

  for (const key in data) {
    if (Object.hasOwnProperty.call(data, key)) {
      if (
        key !== "profile" &&
        key !== "password" &&
        key !== "token" &&
        key !== "lastLogin" &&
        key !== "languagesSpoken"
      ) {
        const rowLabel = labelDict[key] || key;
        const value = data[key];
        const row = `<tr>
          <td style="width: 40%; font-weight: 600; color: #475569; background: #f8fafc;">${rowLabel}</td>
          <td style="font-weight: 500; color: #0f172a;">${value}</td>
        </tr>`;
        tableBody.insertAdjacentHTML("beforeend", row);
      }
    }
  }
}

// ----------------- MOOD & RESILIENCE CHART -----------------

async function fetchAnalytics(uid) {
  try {
    const response = await axios.post("http://localhost:8000/get-analysis-of-student", { uid: uid });
    if (response) {
      graphdata = response;
      displayMoodChart();
    }
    document.getElementById("togglepsystu")?.classList.remove("d-none");
    document.getElementById("psydata")?.classList.add("d-none");
  } catch (error) {
    console.error("Error fetching analytics data:", error);
  }
}

function displayMoodChart() {
  if (moodChart) {
    moodChart.destroy();
  }

  const dates = graphdata?.data?.moodDate || [];
  const scores = graphdata?.data?.analyticsResult?.moodScore || [];
  const msgEl = document.getElementById("no-graph-message");

  if (!dates || dates.length === 0) {
    if (msgEl) msgEl.textContent = "No mood tracking data recorded for this student yet.";
    return;
  }
  if (msgEl) msgEl.textContent = "";

  const label = [];
  const subLabels = [];
  const subScores = [];
  const days = [];
  var week = 1;

  dates.forEach((date, index) => {
    const currentDate = new Date(date);
    const currentWeek = currentDate.getWeek ? currentDate.getWeek() : 1;

    if (currentWeek !== week) {
      week = currentWeek;
      label.push(`Week ${week}`);
      subLabels.push([]);
      subScores.push([]);
      days.push([]);
    }

    const dayName = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(currentDate);
    if (subLabels.length === 0) {
      subLabels.push([]);
      subScores.push([]);
      days.push([]);
    }
    subLabels[subLabels.length - 1].push(dayName);
    days[days.length - 1].push(date);
    subScores[subScores.length - 1].push(scores[index]);
  });

  var selectedweek = subScores.length - 1;
  const ctx = document.getElementById("moodChart");
  if (!ctx) return;

  moodChart = new Chart(ctx.getContext("2d"), {
    type: "line",
    data: {
      labels: subLabels[selectedweek] || [],
      datasets: [{
        label: "Mood State (1=Terrible, 5=Amazing)",
        data: subScores[selectedweek] || [],
        backgroundColor: "rgba(99, 102, 241, 0.15)",
        borderColor: "#4f46e5",
        borderWidth: 3,
        fill: true,
        tension: 0.35,
        pointRadius: 5,
        pointBackgroundColor: "#4f46e5"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 1,
          max: 5,
          ticks: {
            stepSize: 1,
            callback: function (val) {
              const labelMap = { 1: "😩 Terrible", 2: "😢 Sad", 3: "😞 Bad", 4: "😄 Happy", 5: "😊 Amazing" };
              return labelMap[val] || val;
            }
          }
        },
        x: {
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: true, position: "top" }
      }
    }
  });

  // Week Controls
  const controls = document.getElementById("moodChartControl");
  if (controls) {
    controls.innerHTML = `
      <button id="prevWeekBtn" class="btn btn-sm btn-outline-secondary">&lt; Previous Week</button>
      <span id="weekLabelDisplay" class="mx-3 font-weight-bold text-muted small">
        ${days[selectedweek] && days[selectedweek].length ? `${days[selectedweek][0]} &bull; ${days[selectedweek][days[selectedweek].length - 1]}` : ""}
      </span>
      <button id="nextWeekBtn" class="btn btn-sm btn-outline-secondary">Next Week &gt;</button>
    `;

    document.getElementById("prevWeekBtn")?.addEventListener("click", () => {
      if (selectedweek > 0) {
        selectedweek--;
        updateGraph();
      }
    });

    document.getElementById("nextWeekBtn")?.addEventListener("click", () => {
      if (selectedweek < subLabels.length - 1) {
        selectedweek++;
        updateGraph();
      }
    });

    function updateGraph() {
      moodChart.data.labels = [...subLabels[selectedweek]];
      moodChart.data.datasets[0].data = [...subScores[selectedweek]];
      moodChart.update();
      const lbl = document.getElementById("weekLabelDisplay");
      if (lbl && days[selectedweek]) {
        lbl.innerHTML = `${days[selectedweek][0]} &bull; ${days[selectedweek][days[selectedweek].length - 1]}`;
      }
    }
  }

  // Resilience & Login info
  const avgEl = document.getElementById("averagemoodscore");
  if (avgEl) {
    avgEl.innerHTML = `
      <div class="card p-3 border rounded shadow-sm bg-white">
        <span class="text-muted small font-weight-bold text-uppercase">Resilience Points</span>
        <h2 style="font-weight: 800; color: #4f46e5; margin: 4px 0;">${(dates.length * 5) + 30} pts</h2>
        <small class="text-success font-weight-bold">🌟 Earned from breathwork & journaling</small>
      </div>`;
  }

  const anEl = document.getElementById("analytics");
  if (anEl) {
    const today = new Date();
    anEl.innerHTML = `
      <div class="card p-3 border rounded shadow-sm bg-white">
        <span class="text-muted small font-weight-bold text-uppercase">Active Stress Tracking</span>
        <h4 style="font-weight: 700; color: #0f172a; margin: 4px 0;">${dates.length} Days Recorded</h4>
        <small class="text-muted font-weight-bold">Consistent daily coping participation</small>
      </div>`;
  }
}

// ----------------- PSYCHOLOGISTS LIST & APPOINTMENTS -----------------

async function fetchDoctorsByCollege(collegeCode) {
  if (localStorage.getItem("doctorsData")) {
    return JSON.parse(localStorage.getItem("doctorsData"));
  }
  try {
    const response = await axios.get(`http://localhost:8000/admin/doctorforcollege/${collegeCode}`);
    doctorsData = response.data || [];
    localStorage.setItem("doctorsData", JSON.stringify(doctorsData));
    return doctorsData;
  } catch (error) {
    console.error("Error fetching doctors data:", error);
    return [];
  }
}

fetchDoctorsByCollege(localStorage.getItem("Collegecode") || "COL001").then((docs) => {
  displayDoctorsDataInTable(docs);
  const kpiDocs = document.getElementById("kpi-total-doctors");
  if (kpiDocs) kpiDocs.textContent = `${docs.length} Available`;
});

function displayDoctorsDataInTable(docs) {
  const tableBody = document.querySelector("#doctorsTable tbody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  docs.forEach((doctor, index) => {
    const row = `<tr>
      <td>
        <strong>${doctor.nickname || doctor.name}</strong><br>
        <small class="text-muted">${doctor.email}</small>
      </td>
      <td><span class="badge badge-light border text-primary">${doctor.area_of_expertise}</span></td>
      <td><small style="color: #475569;">${doctor.phonenumber || "+91 98765 43210"}</small></td>
    </tr>`;
    tableBody.insertAdjacentHTML("beforeend", row);
  });

  const rows = tableBody.querySelectorAll("tr");
  rows.forEach((row, index) => {
    row.addEventListener("click", () => {
      const puid = docs[index].id || docs[index].uid;
      getAppointments(puid, docs[index]);
    });
  });
}

async function getAppointments(puid, doctorInfo) {
  try {
    const response = await axios.post("http://localhost:8000/getAppointmentsByDoctor", { puid });
    const appointments = response.data;
    const all = [...(appointments.approvedAppointments || []), ...(appointments.pendingAppointments || [])];
    displayAppointments(all, doctorInfo);
  } catch (error) {
    console.error("Error fetching appointments:", error);
  }
}

function displayAppointments(appointments, doctorInfo) {
  document.getElementById("togglepsystu")?.classList.add("d-none");
  const appointmentsDiv = document.getElementById("psydata");
  if (!appointmentsDiv) return;
  appointmentsDiv.classList.remove("d-none");
  appointmentsDiv.innerHTML = "";

  let html = `
    <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
      <div>
        <h5 style="font-weight: 800; color: #0f172a; margin: 0;">Appointments & Consultations: ${doctorInfo?.nickname || "Psychologist"}</h5>
        <small class="text-muted">${doctorInfo?.area_of_expertise || ""}</small>
      </div>
      <button class="btn btn-sm btn-outline-secondary" onclick="closeDoctorView()">Back to Student Analytics</button>
    </div>
  `;

  if (appointments.length === 0) {
    html += `<div class="p-4 text-center text-muted">No appointments booked for this psychologist currently.</div>`;
  } else {
    appointments.forEach((apt) => {
      html += `
        <div class="card p-3 mb-3 border rounded shadow-sm">
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
              <img src="${apt.userDetails.profile || "./images/resources/defaultpic.jpg"}" class="rounded-circle mr-3" style="width: 48px; height: 48px; object-fit: cover;">
              <div>
                <h6 style="font-weight: 700; margin: 0;">${apt.userDetails.name}</h6>
                <small class="text-muted">${apt.userDetails.occupation} &bull; Age: ${apt.userDetails.age}</small>
              </div>
            </div>
            <div>
              <span class="badge ${apt.status === "approved" ? "badge-success" : "badge-warning"} font-weight-bold px-3 py-2">
                ${apt.status.toUpperCase()}
              </span>
            </div>
          </div>
          <div class="mt-2 pt-2 border-top small text-muted d-flex justify-content-between">
            <span>📅 <strong>Scheduled Slot:</strong> ${apt.date} at ${apt.timeSlot}</span>
            <span>✉️ ${apt.userDetails.email}</span>
          </div>
        </div>`;
    });
  }

  appointmentsDiv.innerHTML = html;
}

window.closeDoctorView = function () {
  document.getElementById("togglepsystu")?.classList.remove("d-none");
  document.getElementById("psydata")?.classList.add("d-none");
};

// ----------------- STUDENT POSTS -----------------

async function fetchPosts(uid, page = 1) {
  try {
    const response = await axios.get("http://localhost:8000/filterPostByUid", { params: { uid, page } });
    return response.data;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return null;
  }
}

async function loadPosts(uid, page = 1, append = false) {
  try {
    const data = await fetchPosts(uid, page);
    const container = document.getElementById("posts-container");
    if (!container) return;
    if (!append) container.innerHTML = "";

    if (data && data.posts && data.posts.length > 0) {
      data.posts.forEach((post) => {
        const postCard = `
          <div class="col-12 mb-3">
            <div class="card p-3 border rounded shadow-sm">
              <h6 style="font-weight: 700; color: #4338ca;">${post.title}</h6>
              <p style="color: #334155; font-size: 0.9rem; margin-bottom: 6px;">${post.description}</p>
              ${post.imageUrl ? `<img src="${post.imageUrl}" style="max-height: 200px; object-fit: cover; border-radius: 8px;" class="mb-2">` : ""}
              <small class="text-muted font-weight-bold">Shared in Campus Community</small>
            </div>
          </div>`;
        container.insertAdjacentHTML("beforeend", postCard);
      });
    } else if (!append) {
      container.innerHTML = `<div class="col-12 text-center text-muted py-4">No community posts published by this student yet.</div>`;
    }
  } catch (e) {
    console.error(e);
  }
}

// ----------------- EXCEL EXPORT -----------------

document.getElementById("convertToExcel")?.addEventListener("click", downloadExcel);

function downloadExcel() {
  if (!students || students.length === 0) {
    alert("No student data available to export.");
    return;
  }

  const exportData = students.map((item) => {
    const d = item.details.fulldetails || {};
    return {
      "Student UID": item.uid,
      "Name": d.nickname || "",
      "Email": d.email || "",
      "Age": d.age || "",
      "Department": d.dept || "",
      "Course / Year": d.occupation || "",
      "Stress Severity": d.stressLevel || "Moderate",
      "Academic Stress Score (Out of 30)": d.stressScore || 16,
      "Anxiety Score (Out of 24)": d.anxietyScore || 12,
      "Sleep Score (Out of 24)": d.sleepScore || 10,
      "Primary Coping Mechanism": d.copingTechnique || "",
      "Resilience Points": d.resiliencePoints || 80,
      "Account Status": d.token ? "Active" : "Offline"
    };
  });

  const time = new Date().toISOString().slice(0, 10);
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Student_Stress_Coping");
  XLSX.writeFile(workbook, `College_Student_Stress_Coping_Report_${time}.xlsx`);
}

function getParams() {
  const params = {};
  const queryString = window.location.search.substring(1);
  const pairs = queryString.split("&");
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split("=");
    if (pair[0]) {
      params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
    }
  }
  return params;
}

Date.prototype.getWeek = function () {
  const onejan = new Date(this.getFullYear(), 0, 1);
  const weekStart = new Date(onejan.getFullYear(), onejan.getMonth(), onejan.getDate() - onejan.getDay());
  const diff = this - weekStart;
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
};
