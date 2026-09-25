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

fetch(`${getApiBase()}/admin/doctors`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(response => response.json())
.then(data => {
  const peopleList = document.getElementById("people-list");
  if (!peopleList) return;
  peopleList.innerHTML = "";
  users = data.users || [];
  const docValue = params["doc"];

  if (docValue) {
    const filtered = users.filter((u) => u.uid === docValue);
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

  // Render psychologist cards
  users.forEach(doctor => {
    const card = document.createElement("div");
    card.style.cssText = "background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 14px; transition: all 0.2s ease;";
    card.onmouseover = () => { card.style.borderColor = 'rgba(99,102,241,0.4)'; card.style.background = 'var(--bg-card-hover)'; };
    card.onmouseout = () => { card.style.borderColor = 'var(--border-subtle)'; card.style.background = 'var(--bg-card)'; };

    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px;">
        <img src="${doctor.profile || './images/resources/defaultpic.jpg'}" alt="Doctor" style="width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 2px solid #10b981;" />
        <div>
          <h4 style="margin: 0 0 4px; font-size: 1.05rem; color: #fff;">${doctor.nickname || doctor.name}</h4>
          <span style="font-size: 0.8rem; color: #38bdf8; font-weight: 600;">${doctor.area_of_expertise || "Clinical Student Stress Specialist"}</span>
          <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 3px;">
            <i class="fa fa-clock" style="color: #10b981;"></i> Next: ${doctor.nextAvailableTime || "Tomorrow, 10:00 AM"}
          </div>
        </div>
      </div>
      <a href="groups.html?doc=${doctor.uid}#appoint" class="serene-btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem; text-decoration: none; flex-shrink: 0;">
        Book Slot
      </a>
    `;
    peopleList.appendChild(card);
  });
})
.catch(error => {
  console.error("Error fetching doctors:", error);
});
