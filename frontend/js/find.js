var users = [];
var params = getParams();

function getApiBase() {
  return window.location.origin;
}

function getParams() {
  var params = {};
  var queryString = window.location.search.substring(1);
  var pairs = queryString.split("&");
  for (var i = 0; i < pairs.length; i++) {
    if (!pairs[i]) continue;
    var pair = pairs[i].split("=");
    params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
  }
  return params;
}

const defaultDoctors = [
  {
    uid: "doc_001",
    name: "Dr. Ananya Sharma, Ph.D.",
    nickname: "Dr. Ananya Sharma",
    area_of_expertise: "Student Stress & Exam Anxiety Specialist",
    nextAvailableTime: "Today, 3:30 PM",
    profile: "images/counselor_hero.jpg"
  },
  {
    uid: "doc_002",
    name: "Dr. Rajesh Iyer, MD",
    nickname: "Dr. Rajesh Iyer",
    area_of_expertise: "Cognitive Behavioral & Burnout Resilience",
    nextAvailableTime: "Tomorrow, 10:00 AM",
    profile: "images/resources/defaultpic.jpg"
  },
  {
    uid: "doc_003",
    name: "Dr. Priya Nair, M.Phil.",
    nickname: "Dr. Priya Nair",
    area_of_expertise: "Mindfulness & Somatic Coping Coach",
    nextAvailableTime: "Tomorrow, 2:00 PM",
    profile: "images/affirmation.png"
  }
];

function renderDoctorsList(docList) {
  const peopleList = document.getElementById("people-list");
  if (!peopleList) return;
  peopleList.innerHTML = "";

  const docValue = params["doc"] || (docList[0] ? docList[0].uid : null);

  if (docValue) {
    const filtered = docList.filter((u) => u.uid === docValue);
    if (filtered.length > 0) {
      const selectedpsy = document.querySelector('#card-title');
      const selectedpsychat = document.querySelector('#chat-btn');
      const docImg = document.getElementById("imageselcted");
      if (selectedpsy) selectedpsy.textContent = filtered[0].nickname || filtered[0].name;
      if (docImg) docImg.src = filtered[0].profile || './images/resources/defaultpic.jpg';
      if (selectedpsychat) {
        selectedpsychat.setAttribute('href', 'messages.html?puid=' + filtered[0].uid + '&uname=' + encodeURIComponent(filtered[0].nickname || filtered[0].name));
      }
    }
  }

  docList.forEach(doctor => {
    const card = document.createElement("div");
    card.style.cssText = "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px 20px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; gap: 16px; box-shadow: 0 4px 15px rgba(2, 132, 199, 0.05); transition: all 0.25s ease;";
    card.onmouseover = () => { card.style.borderColor = '#0284c7'; card.style.boxShadow = '0 8px 24px rgba(2, 132, 199, 0.12)'; card.style.transform = 'translateY(-2px)'; };
    card.onmouseout = () => { card.style.borderColor = '#e2e8f0'; card.style.boxShadow = '0 4px 15px rgba(2, 132, 199, 0.05)'; card.style.transform = 'none'; };

    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px;">
        <img src="${doctor.profile || './images/resources/defaultpic.jpg'}" alt="Doctor" style="width: 54px; height: 54px; border-radius: 50%; object-fit: cover; border: 2.5px solid #10b981; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);" />
        <div>
          <h4 style="margin: 0 0 4px; font-size: 1.05rem; color: #0f172a; font-weight: 700;">${doctor.nickname || doctor.name}</h4>
          <span style="font-size: 0.82rem; color: #0284c7; font-weight: 600;">${doctor.area_of_expertise || "Clinical Student Stress Specialist"}</span>
          <div style="font-size: 0.78rem; color: #059669; margin-top: 3px; font-weight: 600;">
            <i class="fa fa-clock" style="color: #10b981;"></i> Next: ${doctor.nextAvailableTime || "Tomorrow, 10:00 AM"}
          </div>
        </div>
      </div>
      <a href="groups.html?doc=${doctor.uid}#appoint" class="serene-btn-primary" style="padding: 0.55rem 1.15rem; font-size: 0.85rem; text-decoration: none; flex-shrink: 0; background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);">
        Book Session
      </a>
    `;
    peopleList.appendChild(card);
  });
}

fetch(`${getApiBase()}/admin/doctors`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(response => response.json())
.then(data => {
  users = (data && data.users && data.users.length > 0) ? data.users : defaultDoctors;
  renderDoctorsList(users);
})
.catch(error => {
  console.log("Using campus wellness psychologist registry:", error);
  users = defaultDoctors;
  renderDoctorsList(users);
});
