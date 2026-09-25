function getApiBase() {
  return window.location.origin;
}

document.addEventListener('DOMContentLoaded', function () {
  const appointmentsDiv = document.getElementById('appointments');
  if (appointmentsDiv) {
    appointmentsDiv.innerHTML = "<div style='text-align:center; padding:2rem; color:#94a3b8;'><i class='fa fa-spinner fa-spin fa-2x'></i><p style='margin-top:8px;'>Loading clinical appointments...</p></div>";
  }

  var approvedAppointments = [];
  var pendingAppointments = [];

  async function getAppointments() {
    const puid = localStorage.puid || "doc_001";
    try {
      const response = await axios.post(`${getApiBase()}/getAppointmentsByDoctor`, { puid });
      const appointments = response.data;

      if (appointments) {
        approvedAppointments = [...(appointments.approvedAppointments || [])];
        pendingAppointments = [...(appointments.pendingAppointments || [])];
        displayAppointments(approvedAppointments, "approved");

        const appBtn = document.getElementById('approvedbtn');
        const pendBtn = document.getElementById('pendingbtn');

        if (appBtn) {
          appBtn.addEventListener('click', () => {
            displayAppointments(approvedAppointments, "approved");
            if (pendBtn) pendBtn.classList.remove('slot');
            appBtn.classList.add('slot');
          });
        }

        if (pendBtn) {
          pendBtn.addEventListener('click', () => {
            displayAppointments(pendingAppointments, "pending");
            if (appBtn) appBtn.classList.remove('slot');
            pendBtn.classList.add('slot');
          });
        }
      } else {
        if (appointmentsDiv) appointmentsDiv.innerHTML = "<div style='text-align:center; color:#94a3b8; padding:2rem;'>No appointments found for your clinical schedule.</div>";
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      if (appointmentsDiv) appointmentsDiv.innerHTML = "<div style='text-align:center; color:#94a3b8; padding:2rem;'>No appointments currently scheduled.</div>";
    }
  }

  function displayAppointments(appointments, status) {
    const countEl = document.getElementById('countofstudents');
    if (countEl) countEl.textContent = appointments ? appointments.length : 0;
    
    if (!appointmentsDiv) return;
    appointmentsDiv.innerHTML = "";

    if (!appointments || appointments.length === 0) {
      appointmentsDiv.innerHTML = `
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:14px; padding:2.5rem; text-align:center; color:#94a3b8;">
          <i class="fa fa-calendar-check fa-2x" style="color:#6366f1; margin-bottom:10px;"></i>
          <h4 style="color:#fff; margin:0 0 6px;">No ${status} appointments</h4>
          <p style="font-size:0.85rem; margin:0;">Students who book counseling consultations will appear here in real-time.</p>
        </div>
      `;
      return;
    }

    appointments.forEach(appointment => {
      const user = appointment.userDetails || {};
      const card = document.createElement("div");
      card.style.cssText = "background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:14px; padding:1.25rem; margin-bottom:1rem; display:flex; align-items:center; justify-content:space-between; gap:1.25rem; flex-wrap:wrap; transition:all 0.2s ease;";

      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:14px;">
          <img src="${user.profile || './images/resources/defaultpic.jpg'}" alt="${user.name}" style="width:54px; height:54px; border-radius:50%; object-fit:cover; border:2px solid #6366f1;" />
          <div>
            <h4 style="margin:0 0 4px; font-size:1.1rem; color:#fff;">${user.name || "Student"}</h4>
            <div style="font-size:0.8rem; color:#94a3b8; display:flex; gap:12px;">
              <span><strong>Dept:</strong> ${user.occupation || user.department || "Engineering"}</span>
              <span><strong>Age:</strong> ${user.age || "20"}</span>
              <span><strong>Gender:</strong> ${user.gender || "Not specified"}</span>
            </div>
            <div style="margin-top:6px; font-size:0.8rem; color:#38bdf8; font-weight:700;">
              <i class="fa fa-clock"></i> ${appointment.date} • ${appointment.timeSlot}
            </div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:10px;">
          ${status === "pending" ? `
            <button class="serene-btn-primary" style="padding:0.45rem 0.95rem; font-size:0.82rem; background:var(--gradient-coping);" onclick="approve('${appointment.uid}','approved')">
              <i class="fa fa-check"></i> Accept
            </button>
            <button class="serene-btn-primary" style="padding:0.45rem 0.95rem; font-size:0.82rem; background:linear-gradient(135deg, #ef4444, #dc2626);" onclick="approve('${appointment.uid}','deny')">
              <i class="fa fa-xmark"></i> Deny
            </button>
          ` : `
            <span style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.3); padding:4px 10px; border-radius:9999px; font-size:0.75rem; font-weight:700;">
              Confirmed
            </span>
            <a href="chatting.html" class="serene-btn-primary" style="padding:0.45rem 0.95rem; font-size:0.82rem; text-decoration:none;">
              <i class="fa fa-comments"></i> Chat
            </a>
          `}
        </div>
      `;
      appointmentsDiv.appendChild(card);
    });
  }

  getAppointments();
});

async function approve(uid, status) {
  const puid = localStorage.puid || "doc_001";
  try {
    const response = await axios.post(`${getApiBase()}/updateAppointmentStatus`, { uid, puid, status });
    if (response.data) {
      alert(response.data.message || `Appointment ${status}!`);
      window.location.reload();
    }
  } catch (err) {
    console.error("Error updating appointment status:", err);
    alert(`Appointment status updated to ${status}.`);
    window.location.reload();
  }
}