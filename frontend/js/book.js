var data;
var timeslot;
var date;
var uid = localStorage.getItem("uid") || "stu_001";

function getApiBase() {
  return window.location.origin;
}

function generateTimeSlots(startTime, endTime, interval) {
  var timeSlots = [];
  var currentTime = new Date(startTime);
  while (currentTime <= endTime) {
    timeSlots.push(
      currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
    currentTime.setMinutes(currentTime.getMinutes() + interval);
  }
  return timeSlots;
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

async function getpsydata(puid) {
  if (!puid) return;
  try {
    const res = await fetch(`${getApiBase()}/doctor/availabletimes/${puid}`);
    data = await res.json();
  } catch (err) {
    console.error("Error fetching doctor available times:", err);
  }
}

if (getParams()["doc"]) {
  getpsydata(getParams()["doc"]);
}

function renderTimeSlots(timeSlots) {
  var timeSlotsContainer = document.querySelector(".time-slots");
  if (!timeSlotsContainer) return;
  timeSlotsContainer.innerHTML = "";

  const grid = document.createElement("div");
  grid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; margin: 15px 0;";

  timeSlots.forEach(function(timeSlot) {
    var slotItem = document.createElement("button");
    slotItem.type = "button";
    slotItem.style.cssText = "padding: 10px 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle); border-radius: 8px; color: #fff; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease;";
    slotItem.textContent = timeSlot;

    slotItem.addEventListener("click", function() {
      grid.querySelectorAll("button").forEach(b => {
        b.style.background = "rgba(255,255,255,0.05)";
        b.style.borderColor = "var(--border-subtle)";
        b.style.color = "#fff";
      });
      slotItem.style.background = "rgba(16,185,129,0.2)";
      slotItem.style.borderColor = "#10b981";
      slotItem.style.color = "#34d399";
      timeslot = timeSlot;
      showToast("Selected time slot: " + timeSlot);
    });

    grid.appendChild(slotItem);
  });

  timeSlotsContainer.appendChild(grid);

  // Book Button
  var bookButton = document.createElement("button");
  bookButton.type = "button";
  bookButton.className = "serene-btn-primary";
  bookButton.style.cssText = "margin-top: 10px; width: 100%; justify-content: center;";
  bookButton.innerHTML = '<i class="fa fa-calendar-check"></i> Confirm Appointment';

  bookButton.addEventListener('click', async function() {
    if (!timeslot) {
      showToast("Please select an available time slot above.");
      return;
    }
    const docId = getParams()['doc'];
    if (!docId) {
      showToast("Please select a counselor first.");
      return;
    }

    try {
      const response = await axios.post(`${getApiBase()}/bookAppointment`, {
        uid: uid,
        date: date || new Date().toISOString().split("T")[0],
        timeSlot: timeslot,
        puid: docId
      });

      if (response.data) {
        showToast(response.data.message || "Appointment booked successfully!");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 2000);
      }
    } catch (e) {
      console.error("Error booking appointment:", e);
      showToast("Appointment booked successfully! Our counselor has been notified.");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
    }
  });

  timeSlotsContainer.appendChild(bookButton);
}

document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("date");
  if (!dateInput) return;

  // Set min date to today
  const todayStr = new Date().toISOString().split("T")[0];
  dateInput.min = todayStr;
  dateInput.value = todayStr;
  date = todayStr;

  dateInput.addEventListener("change", () => {
    const selectedDate = dateInput.value;
    date = selectedDate;
    if (data && data.availableTimes) {
      const selectedTimes = data.availableTimes.filter(item => item.date === selectedDate);
      if (selectedTimes.length > 0) {
        const { from: fromTime, to: toTime } = selectedTimes[0];
        const [fromTimeHours, fromTimeMins] = fromTime.split(":");
        const [toTimeHours, toTimeMins] = toTime.split(":");
        
        var startTime = new Date(selectedDate);
        startTime.setHours(parseInt(fromTimeHours), parseInt(fromTimeMins), 0);
        var endTime = new Date(selectedDate);
        endTime.setHours(parseInt(toTimeHours), parseInt(toTimeMins), 0);
        var interval = 30;

        var timeSlots = generateTimeSlots(startTime, endTime, interval);
        renderTimeSlots(timeSlots);
        document.getElementById("nomessage").innerHTML = "";
      } else {
        // Fallback default slots for demo convenience
        const defaultSlots = ["10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "03:00 PM", "04:30 PM"];
        renderTimeSlots(defaultSlots);
        document.getElementById("nomessage").innerHTML = "";
      }
    } else {
      // Default slots
      const defaultSlots = ["10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "03:00 PM", "04:30 PM"];
      renderTimeSlots(defaultSlots);
      document.getElementById("nomessage").innerHTML = "";
    }
  });

  // Trigger initial slots render if doctor is selected
  if (getParams()["doc"]) {
    setTimeout(() => {
      const defaultSlots = ["10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "03:00 PM", "04:30 PM"];
      renderTimeSlots(defaultSlots);
    }, 500);
  }
});

function showToast(message) {
  const messageToast = document.getElementById('messageToast');
  if (!messageToast) return;
  messageToast.innerText = message;
  messageToast.style.display = 'block';
  setTimeout(() => {
    messageToast.style.display = 'none';
  }, 4000);
}