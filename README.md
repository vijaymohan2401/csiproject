# SereneCampus - College Student Stress Levels & Coping Mechanisms Intelligence System

> **Problem Statement**: *"Stress Levels and Coping Mechanisms of the students in the college"*

**SereneCampus** is a full-stack mental health intelligence and clinical support portal designed specifically for university administrations, college students, and campus psychologists. It provides real-time monitoring of academic stress, exam anxiety, and sleep disruption while actively promoting evidence-based coping mechanisms such as **Box Breathing**, **4-7-8 Breathwork**, **5-4-3-2-1 Sensory Grounding**, **Gratitude Journaling**, and **21/90 Habit Tracking**.

---

## 📁 Project Structure

```
Psyshell_portal-main/
│
├── frontend/                     # Modernized Student & Administration Frontend
│   ├── index-2.html              # Clean College Admin Stress & Coping Dashboard
│   ├── landing.html              # Portal Gateway with 1-click demo logins
│   ├── index.html                # Student Wellness Dashboard
│   ├── selftest.html             # Self-Test Assessment on Stress & Anxiety
│   ├── coping.html               # Interactive Coping Mechanisms & Breathwork
│   ├── copingtechs/              # Dedicated breathwork exercises (Box Breathing, etc.)
│   ├── toolsAndTechniques/       # Habit and psychological tools (21/90, 369 rule)
│   ├── js/                       # Modular JavaScript with global config & API routing
│   │   ├── config.js             # Dynamic backend origin detection & interceptors
│   │   ├── college.js            # Executive dashboard charts, registry & scorecard logic
│   │   └── ...
│   └── css/                      # Responsive styling and design system
│
├── backend/                      # Production-Grade Python Backend
│   ├── main.py                   # FastAPI application + Socket.IO ASGI server
│   ├── database.py               # SQLite schema & realistic student stress seed data
│   └── psyshell.db               # SQLite database file
│
├── run_backend.bat               # Single-click launcher script
└── README.md                     # Project documentation
```

---

## ⚡ Quick Start

### 1. Launch the Backend Server
Double-click `run_backend.bat` or run:
```bash
python -m uvicorn backend.main:socket_app --host 127.0.0.1 --port 8000 --reload
```

### 2. Access the Application
Open your browser and navigate to:
* **Landing Page**: [http://127.0.0.1:8000/landing.html](http://127.0.0.1:8000/landing.html)
* **College Stress Dashboard**: [http://127.0.0.1:8000/index-2.html](http://127.0.0.1:8000/index-2.html)

---

## 🔑 Demo Login Credentials

The landing page includes **1-click auto-fill buttons** for immediate testing:

| Role | Email | Password | Target Dashboard |
| :--- | :--- | :--- | :--- |
| **🏛️ College Admin** | `admin@college.edu` | `password123` | [`index-2.html`](http://127.0.0.1:8000/index-2.html) (Stress & Coping Command Center) |
| **🎓 Student** | `rahul@college.edu` | `password123` | [`index.html`](http://127.0.0.1:8000/index.html) (Student Wellness Portal) |
| **🩺 Psychologist** | `sarah.mitchell@psyshell.help` | `password123` | [`index2.html`](http://127.0.0.1:8000/index2.html) (Counselor Clinic Dashboard) |

---

## 📊 College Dashboard Highlights (`index-2.html`)

1. **Executive KPI Stat Banner**:
   - **Monitored Students**: Active registered student headcount.
   - **High Stress Alerts**: Immediate count of students flagged for urgent counselor outreach.
   - **Top Coping Mechanism**: Campus-wide dominant coping strategy (e.g. *Box Breathing - 42% adoption*).
   - **Active Psychologists**: Available licensed counselors on campus.

2. **Visual Analytics Grid**:
   - **Campus Stress Severity Breakdown** (Doughnut Chart: Low, Moderate, High, Severe).
   - **Coping Mechanism Adoption** (Horizontal Bar Chart: Box Breathing, 4-7-8, Grounding, Journaling).
   - **Students by Department** (CSE, ECE, MECH, CIVIL, MBA, etc.).
   - **Student Age Demographics**.

3. **Students Stress Registry Table**:
   - Real-time search across student names, departments, and coping techniques.
   - Color-coded badges for stress severity (🟢 Low, 🟡 Moderate, 🟠 High, 🔴 Severe).
   - One-click **Export to Excel**: Exports complete student records with stress scores and coping techniques.

4. **Student Diagnostic Scorecard & Mood Tracker**:
   - Selecting any student opens their detailed diagnostic profile:
     - Academic Stress Score (e.g., `18 / 30`)
     - Exam Anxiety Level (e.g., `14 / 24`)
     - Sleep Quality Disruption (e.g., `11 / 24`)
     - Primary Coping Practice & Resilience Points
   - Interactive weekly mood line chart with `<` and `>` navigation.
   - Full student profile and reflections feed.

---

## 🛠️ Technology Stack

- **Backend**: FastAPI 0.141, Python 3.14, Python-SocketIO, Uvicorn, SQLite3.
- **Frontend**: Vanilla HTML5, CSS3, JavaScript, Chart.js, DataTables, SheetJS (XLSX).
- **Real-Time**: WebSockets (Socket.IO) for live messaging and WebRTC call signaling.
