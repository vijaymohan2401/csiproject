import os
import json
import time
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, Request, Form, File, UploadFile, HTTPException, Query
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import socketio

from .database import get_db_connection, init_db, seed_data

# Initialize DB on startup
init_db()
seed_data()

# Setup Socket.IO Server
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
app = FastAPI(title="SereneCampus - Student Stress & Coping Mechanisms Intelligence Portal", version="1.0.0")

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
UPLOADS_DIR = os.path.join(FRONTEND_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

# ----------------- SOCKET.IO REALTIME EVENTS -----------------
online_users: Dict[str, str] = {}  # uid -> sid

@sio.event
async def connect(sid, environ):
    pass

@sio.event
async def disconnect(sid):
    for uid, s in list(online_users.items()):
        if s == sid:
            del online_users[uid]
            break

@sio.event
async def join(sid, data):
    sender = data.get("sender")
    receiver = data.get("receiver")
    if sender:
        online_users[sender] = sid
        await sio.enter_room(sid, sender)

@sio.event
async def getPreviousMessages(sid, data):
    sender = data.get("sender")
    receiver = data.get("receiver")
    if not sender or not receiver:
        return
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT sender, receiver, text, timestamp FROM chat_messages
    WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)
    ORDER BY timestamp ASC
    """, (sender, receiver, receiver, sender))
    rows = cursor.fetchall()
    conn.close()

    msgs = [{"sender": r["sender"], "receiver": r["receiver"], "text": r["text"], "timestamp": r["timestamp"]} for r in rows]
    await sio.emit("previousMessages", msgs, to=sid)

@sio.event
async def sendMessage(sid, data):
    sender = data.get("sender")
    receiver = data.get("receiver")
    text = data.get("text", "")
    ts = int(time.time())

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO chat_messages (sender, receiver, text, timestamp) VALUES (?, ?, ?, ?)", (sender, receiver, text, ts))
    conn.commit()
    conn.close()

    msg_payload = {"sender": sender, "receiver": receiver, "text": text, "timestamp": ts}
    if receiver in online_users:
        await sio.emit("message", msg_payload, to=online_users[receiver])
    await sio.emit("message", msg_payload, to=sid)

# WebRTC Video Call Signaling
@sio.event
async def callUser(sid, data):
    receiver = data.get("userToCall")
    if receiver in online_users:
        await sio.emit("callUser", {
            "signal": data.get("signalData"),
            "from": data.get("from")
        }, to=online_users[receiver])

@sio.event
async def answerCall(sid, data):
    to = data.get("to")
    if to in online_users:
        await sio.emit("callAccepted", data.get("signal"), to=online_users[to])

@sio.event
async def iceCandidate(sid, data):
    receiver = data.get("receiver")
    if receiver in online_users:
        await sio.emit("iceCandidate", data, to=online_users[receiver])

@sio.event
async def endCall(sid, data):
    receiver = data.get("receiver")
    if receiver in online_users:
        await sio.emit("callEnded", {}, to=online_users[receiver])


# ----------------- AUTHENTICATION ROUTES -----------------

@app.post("/UserLogin")
async def user_login(request: Request):
    body = await request.json()
    email = body.get("email", "").strip()
    password = body.get("password", "").strip()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND password = ?", (email, password))
    user = cursor.fetchone()

    if not user:
        conn.close()
        return JSONResponse({"message": "Invalid email or password", "status": 400}, status_code=200)

    now_ts = int(time.time())
    cursor.execute("UPDATE users SET last_login = ? WHERE uid = ?", (now_ts, user["uid"]))
    conn.commit()

    userData = {
        "uid": user["uid"],
        "nickname": user["nickname"],
        "email": user["email"],
        "age": user["age"],
        "college": user["college"],
        "token": user["token"],
        "details": {
            "name": user["nickname"],
            "nickname": user["nickname"],
            "email": user["email"],
            "age": user["age"],
            "dept": user["dept"],
            "occupation": user["occupation"],
            "gender": user["gender"],
            "relationshipstatus": user["relationshipstatus"],
            "languagesSpoken": json.loads(user["languagesSpoken"] or "[]"),
            "profile": user["profile"],
            "token": user["token"],
            "lastLogin": {"_seconds": now_ts, "_nanoseconds": 0}
        }
    }
    conn.close()
    return {"message": "Login successful", "userData": userData}

@app.post("/registerUseronweb")
async def register_user(request: Request):
    body = await request.json()
    nickname = body.get("nickname", "").strip()
    email = body.get("email", "").strip()
    password = body.get("password", "").strip()
    age = int(body.get("age", 20))
    college = body.get("college", "COL001")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email,))
    if cursor.fetchone():
        conn.close()
        return JSONResponse({"message": "Email already exists", "status": 400})

    cursor.execute("SELECT * FROM users WHERE LOWER(nickname) = LOWER(?)", (nickname,))
    if cursor.fetchone():
        conn.close()
        return JSONResponse({"message": "nickname already exist", "status": 400})

    dept = body.get("dept", "Computer Science & Engineering")
    occupation = body.get("occupation", "1st Year Undergraduate")
    gender = body.get("gender", "Unspecified")
    coping = body.get("coping_technique", "Box Breathing & 21/90 Routine")

    uid = f"stu_{int(time.time()*1000)%1000000}"
    token = f"tok_{uid}"
    now_ts = int(time.time())
    cursor.execute("""
    INSERT INTO users (uid, nickname, email, password, age, college, dept, occupation, gender, relationshipstatus, languagesSpoken, token, last_login, stress_level, stress_score, anxiety_score, sleep_score, coping_technique, resilience_points, profile)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        uid, nickname, email, password, age, college,
        dept, occupation, gender, "Single",
        json.dumps(["English"]), token, now_ts, "Moderate", 16, 12, 10, coping, 50, "./images/resources/defaultpic.jpg"
    ))
    conn.commit()
    conn.close()
    return {"message": "User registered successfully", "status": 200}

@app.post("/psychologistLogin")
async def psychologist_login(request: Request):
    body = await request.json()
    email = body.get("email", "").strip()
    password = body.get("password", "").strip()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM doctors WHERE LOWER(email) = LOWER(?) AND password = ?", (email, password))
    doc = cursor.fetchone()
    conn.close()

    if not doc:
        return JSONResponse({"message": "Invalid email or password", "status": 400})

    userData = {
        "uid": doc["uid"],
        "nickname": doc["nickname"],
        "name": doc["name"],
        "email": doc["email"],
        "token": doc["token"],
        "area_of_expertise": doc["area_of_expertise"],
        "phonenumber": doc["phonenumber"],
        "details": {
            "name": doc["name"],
            "nickname": doc["nickname"],
            "email": doc["email"],
            "gender": doc["gender"],
            "age": doc["age"],
            "phonenumber": doc["phonenumber"],
            "area_of_expertise": doc["area_of_expertise"],
            "language": json.loads(doc["languages"] or "[]"),
            "profile": doc["profile"]
        }
    }
    return {"message": "Login successful", "userData": userData}

@app.post("/registerPsychologistonweb")
async def register_psychologist(request: Request):
    body = await request.json()
    nickname = body.get("nickname", "").strip()
    email = body.get("email", "").strip()
    password = body.get("password", "").strip()
    aoe = body.get("area_of_expertise", "Student Stress & Coping Mechanisms")
    phone = body.get("phonenumber", "+91 98765 43210")
    college = body.get("collegecode", "COL001")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM doctors WHERE LOWER(email) = LOWER(?)", (email,))
    if cursor.fetchone():
        conn.close()
        return JSONResponse({"message": "Email already exists", "status": 400})

    puid = f"psy_{int(time.time()*1000)%1000000}"
    token = f"tok_{puid}"
    cursor.execute("""
    INSERT INTO doctors (uid, nickname, name, email, password, area_of_expertise, phonenumber, profile, gender, age, languages, collegecode, available_days, next_available_time, token)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        puid, nickname, nickname, email, password, aoe, phone,
        "./images/resources/defaultpic.jpg", "Female", 32,
        json.dumps(["English"]), college, json.dumps(["Monday", "Wednesday"]), "Tomorrow 2:00 PM", token
    ))
    conn.commit()
    conn.close()
    return {"message": "Psychologist registered successfully", "status": 200}

@app.post("/collegelogin")
async def college_login(request: Request):
    body = await request.json()
    email = body.get("email", "").strip()
    password = body.get("password", "").strip()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM colleges WHERE LOWER(email) = LOWER(?) AND password = ?", (email, password))
    clg = cursor.fetchone()
    conn.close()

    if not clg:
        return JSONResponse({"message": "Login failed", "error": "Invalid college credentials"}, status_code=200)

    return {
        "message": "Login successful",
        "collegeData": {
            "collegecode": clg["collegecode"],
            "collegename": clg["collegename"],
            "email": clg["email"]
        }
    }

@app.get("/listcolleges")
async def list_colleges():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT collegecode, collegename FROM colleges")
    rows = cursor.fetchall()
    conn.close()
    return {"list": [{"collegecode": r["collegecode"], "collegename": r["collegename"]} for r in rows]}

@app.post("/protected-route-user")
async def protected_route_user(request: Request):
    body = await request.json()
    uid = body.get("uid")
    token = body.get("token")
    if not uid or not token:
        return JSONResponse({"message": "Unauthorized - Missing token"}, status_code=401)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE uid = ? AND token = ?", (uid, token))
    user = cursor.fetchone()
    conn.close()
    if user:
        return {"valid": True, "message": "Authorized"}
    return JSONResponse({"message": "Unauthorized - Missing token"}, status_code=401)

@app.post("/protected-route-doctor")
async def protected_route_doctor(request: Request):
    body = await request.json()
    puid = body.get("puid")
    token = body.get("token")
    if not puid or not token:
        return JSONResponse({"message": "Unauthorized - Missing token"}, status_code=401)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM doctors WHERE uid = ? AND token = ?", (puid, token))
    doc = cursor.fetchone()
    conn.close()
    if doc:
        return {"valid": True, "message": "Authorized"}
    return JSONResponse({"message": "Unauthorized - Missing token"}, status_code=401)

@app.post("/logout-user")
async def logout_user(request: Request):
    return {"message": "Logged out successfully"}

@app.post("/psychologistLogout")
async def logout_doctor(request: Request):
    return {"message": "Logged out successfully"}


# ----------------- COLLEGE & STUDENT ANALYTICS -----------------

@app.post("/get-students-by-college")
async def get_students_by_college(request: Request):
    body = await request.json()
    code = body.get("code") or "COL001"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE college = ?", (code,))
    users = cursor.fetchall()
    conn.close()

    students = []
    for u in users:
        students.append({
            "uid": u["uid"],
            "details": {
                "fulldetails": {
                    "nickname": u["nickname"],
                    "email": u["email"],
                    "age": u["age"],
                    "dept": u["dept"] or "Engineering",
                    "occupation": u["occupation"] or "Undergraduate Student",
                    "gender": u["gender"] or "Unspecified",
                    "stressLevel": u["stress_level"] or "Moderate",
                    "stressScore": u["stress_score"] or 16,
                    "anxietyScore": u["anxiety_score"] or 12,
                    "sleepScore": u["sleep_score"] or 10,
                    "copingTechnique": u["coping_technique"] or "Box Breathing",
                    "resiliencePoints": u["resilience_points"] or 80,
                    "relationshipstatus": u["relationshipstatus"] or "Single",
                    "languagesSpoken": json.loads(u["languagesSpoken"] or "[]"),
                    "token": u["token"],
                    "lastLogin": {
                        "_seconds": u["last_login"] or int(time.time()),
                        "_nanoseconds": 0
                    }
                }
            }
        })
    return {"students": students}

@app.post("/get-analysis-of-student")
async def get_student_analysis(request: Request):
    body = await request.json()
    uid = body.get("uid")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT date, mood_score FROM mood_logs WHERE uid = ? ORDER BY date ASC", (uid,))
    mood_rows = cursor.fetchall()

    cursor.execute("SELECT * FROM selftest_results WHERE uid = ? ORDER BY timestamp DESC LIMIT 1", (uid,))
    test_row = cursor.fetchone()

    cursor.execute("SELECT stress_level, coping_technique, resilience_points FROM users WHERE uid = ?", (uid,))
    user_row = cursor.fetchone()

    conn.close()

    if not mood_rows:
        # Generate sample fallback 10 days of mood data if brand new user
        base = datetime.now() - timedelta(days=9)
        mood_dates = [(base + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(10)]
        mood_scores = [3, 4, 3, 4, 5, 4, 3, 4, 4, 5]
    else:
        mood_dates = [r["date"] for r in mood_rows]
        mood_scores = [r["mood_score"] for r in mood_rows]

    avg_mood = round(sum(mood_scores) / len(mood_scores), 1) if mood_scores else 3.5

    longest_streak_dates = mood_dates[:]
    current_streak_dates = mood_dates[-6:] if len(mood_dates) >= 6 else mood_dates[:]

    return {
        "data": {
            "moodDate": mood_dates,
            "analyticsResult": {
                "moodScore": mood_scores,
                "averageMoodScore": avg_mood,
                "stressScore": test_row["stress_score"] if test_row else 15,
                "anxietyScore": test_row["anxiety_score"] if test_row else 12,
                "sleepScore": test_row["sleep_score"] if test_row else 9,
                "stressLevel": user_row["stress_level"] if user_row else "Moderate",
                "copingTechnique": user_row["coping_technique"] if user_row else "Box Breathing & Journaling"
            },
            "longestStreak": {
                "length": len(longest_streak_dates),
                "dates": longest_streak_dates
            },
            "currentStreak": {
                "length": len(current_streak_dates),
                "dates": current_streak_dates
            }
        }
    }


# ----------------- PSYCHOLOGISTS / DOCTORS -----------------

@app.get("/admin/doctorforcollege/{collegeCode}")
async def get_doctors_for_college(collegeCode: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM doctors WHERE collegecode = ?", (collegeCode,))
    docs = cursor.fetchall()
    conn.close()

    result = []
    for d in docs:
        result.append({
            "id": d["uid"],
            "uid": d["uid"],
            "email": d["email"],
            "nickname": d["nickname"],
            "name": d["name"],
            "area_of_expertise": d["area_of_expertise"],
            "phonenumber": d["phonenumber"],
            "profile": d["profile"] or "./images/resources/defaultpic.jpg"
        })
    return result

@app.post("/admin/doctors")
async def get_all_doctors():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM doctors")
    docs = cursor.fetchall()
    conn.close()

    users = []
    for d in docs:
        users.append({
            "uid": d["uid"],
            "nickname": d["nickname"],
            "name": d["name"],
            "email": d["email"],
            "area_of_expertise": d["area_of_expertise"],
            "profile": d["profile"] or "./images/resources/defaultpic.jpg",
            "nextAvailableTime": d["next_available_time"] or "Today at 3:00 PM"
        })
    return {"users": users}

@app.get("/doctor/availabletimes/{puid}")
async def doctor_available_times(puid: str):
    return {
        "puid": puid,
        "availableDays": ["Monday", "Wednesday", "Friday"],
        "availableSlots": ["10:00 AM - 10:45 AM", "02:00 PM - 02:45 PM", "04:00 PM - 04:45 PM"]
    }


# ----------------- APPOINTMENTS -----------------

@app.post("/getAppointmentsByDoctor")
async def get_appointments_by_doctor(request: Request):
    body = await request.json()
    puid = body.get("puid")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT a.appointment_id, a.uid, a.puid, a.date, a.time_slot, a.status,
           u.nickname, u.gender, u.age, u.occupation, u.profile, u.relationshipstatus, u.languagesSpoken, u.email
    FROM appointments a
    JOIN users u ON a.uid = u.uid
    WHERE a.puid = ?
    """, (puid,))
    rows = cursor.fetchall()
    conn.close()

    approved = []
    pending = []

    for r in rows:
        item = {
            "appointmentId": r["appointment_id"],
            "uid": r["uid"],
            "puid": r["puid"],
            "date": r["date"],
            "timeSlot": r["time_slot"],
            "status": r["status"],
            "userDetails": {
                "name": r["nickname"],
                "nickname": r["nickname"],
                "gender": r["gender"] or "Unspecified",
                "age": r["age"] or 20,
                "occupation": r["occupation"] or "Student",
                "profile": r["profile"] or "./images/resources/defaultpic.jpg",
                "relationshipstatus": r["relationshipstatus"] or "Single",
                "language": json.loads(r["languagesSpoken"] or "[]"),
                "email": r["email"]
            }
        }
        if r["status"] == "approved":
            approved.append(item)
        else:
            pending.append(item)

    return {"approvedAppointments": approved, "pendingAppointments": pending}

@app.post("/updateAppointmentStatus")
async def update_appointment_status(request: Request):
    body = await request.json()
    uid = body.get("uid")
    puid = body.get("puid")
    status = body.get("status", "approved")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE appointments SET status = ? WHERE uid = ? AND puid = ?", (status, uid, puid))
    conn.commit()
    conn.close()
    return {"message": f"Appointment {status} successfully"}

@app.post("/bookAppointment")
async def book_appointment(request: Request):
    body = await request.json()
    uid = body.get("uid")
    date = body.get("date")
    time_slot = body.get("timeSlot")
    puid = body.get("puid")

    apt_id = f"apt_{int(time.time()*1000)%1000000}"
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO appointments (appointment_id, uid, puid, date, time_slot, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
    """, (apt_id, uid, puid, date, time_slot))
    conn.commit()
    conn.close()
    return {"message": "Appointment booked successfully! Counselor will confirm your slot."}


# ----------------- STRESS & COPING ASSESSMENT (SELF-TEST) -----------------

@app.get("/random-questions")
async def get_random_questions(college: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if college:
        cursor.execute("SELECT * FROM quiz_questions WHERE college = ? ORDER BY id ASC", (college,))
        rows = cursor.fetchall()
        if not rows:
            cursor.execute("SELECT * FROM quiz_questions ORDER BY id ASC")
            rows = cursor.fetchall()
    else:
        cursor.execute("SELECT * FROM quiz_questions ORDER BY id ASC")
        rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        result.append({
            "text": r["text"],
            "options": json.loads(r["options_json"]),
            "scores": json.loads(r["scores_json"]),
            "set": r["set_category"]
        })
    return result

@app.post("/postQuestions")
async def post_questions(request: Request):
    body = await request.json()
    college = body.get("college", "COL001")
    questions = body.get("questions", [])

    conn = get_db_connection()
    cursor = conn.cursor()
    for q in questions:
        opts = [o["option"] for o in q.get("options", [])]
        scores = [int(o["score"]) for o in q.get("options", [])]
        cursor.execute("""
        INSERT INTO quiz_questions (college, text, options_json, scores_json, set_category)
        VALUES (?, ?, ?, ?, ?)
        """, (college, q.get("question"), json.dumps(opts), json.dumps(scores), q.get("category", "stress")))
    conn.commit()
    conn.close()
    return {"message": "Questions added successfully"}

@app.post("/saveSelfTestResults")
async def save_self_test_results(request: Request):
    body = await request.json()
    results = body.get("results", {})
    uid = body.get("uid")

    stress_score = int(results.get("stress", 0))
    anxiety_score = int(results.get("anxiety", 0))
    sleep_score = int(results.get("sleep issues", 0))
    mood_score = int(results.get("Mood", 0))

    # Evaluate Stress Level
    total_stress = stress_score + anxiety_score
    if total_stress <= 10:
        level = "Low"
        recommended_coping = "Mindful Journaling & Light Breathwork"
    elif total_stress <= 20:
        level = "Moderate"
        recommended_coping = "Box Breathing (4-4-4-4) & 21/90 Habit Tracking"
    elif total_stress <= 28:
        level = "High"
        recommended_coping = "5-4-3-2-1 Grounding & Counselor Check-in"
    else:
        level = "Severe"
        recommended_coping = "Immediate Clinical Counseling & Progressive Muscle Relaxation"

    now_ts = int(time.time())
    today = datetime.now().strftime("%Y-%m-%d")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO selftest_results (uid, date, stress_score, anxiety_score, sleep_score, mood_score, raw_results_json, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (uid, today, stress_score, anxiety_score, sleep_score, mood_score, json.dumps(results), now_ts))

    cursor.execute("""
    UPDATE users SET stress_level = ?, stress_score = ?, anxiety_score = ?, sleep_score = ?, coping_technique = ?, resilience_points = resilience_points + 20
    WHERE uid = ?
    """, (level, stress_score, anxiety_score, sleep_score, recommended_coping, uid))
    conn.commit()
    conn.close()

    return {
        "message": "Self-test results saved successfully",
        "stressLevel": level,
        "recommendedCoping": recommended_coping,
        "bonusPoints": 20
    }


# ----------------- DAILY JOURNAL & MOOD TRACKING -----------------

DAILY_QUESTIONS = [
    "What specific academic or personal event triggered your stress today, and what coping technique helped calm your mind?",
    "Identify 3 small achievements or positive moments today that brought you peace of mind.",
    "When feeling overwhelmed today, did you pause to breathe or ground yourself? How did your body respond?",
    "What is one stressful thought you can challenge and reframe with self-compassion right now?",
    "Which coping mechanism (Box Breathing, 4-7-8, or 5-4-3-2-1 Grounding) felt most restorative to you this week?"
]

@app.get("/get-next-question")
async def get_next_question():
    import random
    return {"question": random.choice(DAILY_QUESTIONS)}

@app.post("/submit-daily-journal-answer")
async def submit_journal_answer(request: Request):
    body = await request.json()
    uid = body.get("uid")
    answer = body.get("answer", "")

    now_ts = int(time.time())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO journal_entries (uid, question, answer, timestamp) VALUES (?, ?, ?, ?)", (uid, "Daily Stress & Coping Check-in", answer, now_ts))
    cursor.execute("UPDATE users SET resilience_points = resilience_points + 10 WHERE uid = ?", (uid,))
    conn.commit()
    conn.close()
    return {"message": "Journal answer recorded! +10 Resilience Points earned"}

@app.post("/submit-daily-mood")
async def submit_daily_mood(request: Request):
    body = await request.json()
    uid = body.get("uid")
    mood = body.get("answer", "happy")

    mood_map = {"terrible": 1, "sad": 2, "bad": 3, "happy": 4, "amazing": 5}
    score = mood_map.get(mood.lower(), 4)
    today = datetime.now().strftime("%Y-%m-%d")
    now_ts = int(time.time())

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO mood_logs (uid, date, mood, mood_score, timestamp) VALUES (?, ?, ?, ?, ?)", (uid, today, mood, score, now_ts))
    cursor.execute("UPDATE users SET resilience_points = resilience_points + 5 WHERE uid = ?", (uid,))
    conn.commit()
    conn.close()
    return {"message": "Daily mood recorded successfully! +5 Resilience Points"}


# ----------------- COMMUNITY & POSTS -----------------

@app.get("/get-newsfeed")
async def get_newsfeed(page: int = 1, includeComments: bool = True):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM posts ORDER BY timestamp DESC")
    post_rows = cursor.fetchall()

    posts = []
    for p in post_rows:
        pid = p["post_id"]
        # Author details
        cursor.execute("SELECT nickname, profile FROM users WHERE uid = ?", (p["uid"],))
        u = cursor.fetchone()
        nickname = u["nickname"] if u else "Anonymous Student"
        profile = u["profile"] if u else "./images/resources/defaultpic.jpg"

        # Likes
        cursor.execute("SELECT uid FROM post_likes WHERE post_id = ?", (pid,))
        likes_rows = cursor.fetchall()
        liked_by = {"likes": {lr["uid"]: True for lr in likes_rows}}

        # Comments
        comments = []
        if includeComments:
            cursor.execute("SELECT * FROM post_comments WHERE post_id = ? ORDER BY timestamp ASC", (pid,))
            c_rows = cursor.fetchall()
            for c in c_rows:
                comments.append({
                    "commenterDetails": {
                        "nickname": c["commenter_name"],
                        "profile": c["commenter_profile"] or "./images/resources/defaultpic.jpg"
                    },
                    "comment": c["comment"],
                    "timestamp": {"_seconds": c["timestamp"], "_nanoseconds": 0}
                })

        posts.append({
            "postId": pid,
            "title": p["title"],
            "description": p["description"],
            "imageUrl": p["image_url"],
            "date": {"_seconds": p["timestamp"], "_nanoseconds": 0},
            "likesCount": p["likes_count"],
            "likedBy": liked_by,
            "userDetails": {
                "nickname": nickname,
                "profile": profile,
                "badges": ["Resilience Champion", "Stress Buster"]
            },
            "comments": comments
        })

    conn.close()
    return {"posts": posts}

@app.get("/filterPostByUid")
async def filter_posts_by_uid(uid: str, page: int = 1):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM posts WHERE uid = ? ORDER BY timestamp DESC", (uid,))
    post_rows = cursor.fetchall()
    conn.close()

    posts = []
    for p in post_rows:
        posts.append({
            "title": p["title"],
            "description": p["description"],
            "imageUrl": p["image_url"],
            "date": {"_seconds": p["timestamp"], "_nanoseconds": 0}
        })
    return {"posts": posts}

@app.get("/like-post")
async def like_post(postId: str, userId: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO post_likes VALUES (?, ?)", (postId, userId))
    cursor.execute("UPDATE posts SET likes_count = (SELECT COUNT(*) FROM post_likes WHERE post_id = ?) WHERE post_id = ?", (postId, postId))
    conn.commit()
    conn.close()
    return {"message": "Post liked"}

@app.get("/dislike-post")
async def dislike_post(postId: str, userId: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM post_likes WHERE post_id = ? AND uid = ?", (postId, userId))
    cursor.execute("UPDATE posts SET likes_count = (SELECT COUNT(*) FROM post_likes WHERE post_id = ?) WHERE post_id = ?", (postId, postId))
    conn.commit()
    conn.close()
    return {"message": "Post unliked"}

@app.post("/create-post")
async def create_post(
    title: str = Form(...),
    description: str = Form(...),
    uid: str = Form(...),
    image: Optional[UploadFile] = File(None)
):
    pid = f"post_{int(time.time()*1000)%1000000}"
    img_url = "images/resources/post-1.jpg"

    if image and image.filename:
        filename = f"{pid}_{image.filename}"
        filepath = os.path.join(UPLOADS_DIR, filename)
        with open(filepath, "wb") as f:
            content = await image.read()
            f.write(content)
        img_url = f"uploads/{filename}"

    now_ts = int(time.time())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO posts (post_id, uid, title, description, image_url, timestamp, likes_count)
    VALUES (?, ?, ?, ?, ?, ?, 0)
    """, (pid, uid, title, description, img_url, now_ts))
    conn.commit()
    conn.close()
    return {"message": "Post created successfully"}

@app.post("/doctor/addcomment")
async def doctor_add_comment(request: Request):
    body = await request.json()
    post_id = body.get("postId")
    comment_text = body.get("comment")
    c_details = body.get("commenterDetails", {})
    name = c_details.get("nickname") or "Campus Psychologist"
    profile = c_details.get("profile") or "./images/resources/friend-avatar.jpg"
    uid = c_details.get("uid", "psy_001")

    cid = f"comm_{int(time.time()*1000)%1000000}"
    now_ts = int(time.time())

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO post_comments (comment_id, post_id, uid, commenter_name, commenter_profile, is_doctor, comment, timestamp)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    """, (cid, post_id, uid, name, profile, comment_text, now_ts))
    conn.commit()
    conn.close()
    return {"message": "Comment added successfully"}

@app.post("/deletePost")
async def delete_post(request: Request):
    body = await request.json()
    pid = body.get("postId")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM posts WHERE post_id = ?", (pid,))
    cursor.execute("DELETE FROM post_likes WHERE post_id = ?", (pid,))
    cursor.execute("DELETE FROM post_comments WHERE post_id = ?", (pid,))
    conn.commit()
    conn.close()
    return {"message": "Post deleted"}


# ----------------- LIBRARY BOOKS -----------------

@app.get("/library/books")
async def get_library_books():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM library_books ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()
    return [{"title": r["title"], "author": r["author"], "imageUrl": r["image_url"], "dateCreated": r["date_created"]} for r in rows]


# ----------------- USER PROFILE & DETAILS -----------------

@app.post("/user/activity")
async def user_activity(request: Request):
    body = await request.json()
    uid = body.get("uid")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT date, mood FROM mood_logs WHERE uid = ? ORDER BY timestamp DESC LIMIT 5", (uid,))
    moods = cursor.fetchall()
    conn.close()
    return {"activities": [{"type": "Mood Check-in", "detail": f"Logged mood as {m['mood']}", "date": m["date"]} for m in moods]}

@app.post("/userdetails")
async def update_user_details(request: Request):
    return {"message": "User details updated successfully"}

@app.post("/doctordetails")
async def update_doctor_details(request: Request):
    return {"message": "Doctor details updated successfully"}

@app.post("/change-password")
async def change_password(request: Request):
    body = await request.json()
    uid = body.get("uid")
    new_pass = body.get("newPassword")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET password = ? WHERE uid = ?", (new_pass, uid))
    cursor.execute("UPDATE doctors SET password = ? WHERE uid = ?", (new_pass, uid))
    conn.commit()
    conn.close()
    return {"message": "Password changed successfully"}

@app.post("/store-reminder")
async def store_reminder(request: Request):
    return {"message": "Reminder stored successfully"}

@app.post("/get-records")
async def get_records(request: Request):
    return {"records": []}

@app.post("/api/sendmessages")
async def send_reminder_messages(request: Request):
    return {"message": "Reminders sent successfully"}


# ----------------- DEDICATED COLLEGE STRESS & COPING ANALYTICS API -----------------

@app.get("/api/college-analytics/{collegeCode}")
async def get_college_stress_analytics(collegeCode: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE college = ?", (collegeCode,))
    students = cursor.fetchall()

    cursor.execute("SELECT * FROM doctors WHERE collegecode = ?", (collegeCode,))
    doctors = cursor.fetchall()

    # Department breakdown
    dept_stress = {}
    stress_distribution = {"Low": 0, "Moderate": 0, "High": 0, "Severe": 0}
    coping_adoption = {}
    total_stress_score = 0

    for s in students:
        s_level = s["stress_level"] or "Moderate"
        stress_distribution[s_level] = stress_distribution.get(s_level, 0) + 1

        dept = s["dept"] or "General Engineering"
        score = s["stress_score"] or 15
        total_stress_score += score

        if dept not in dept_stress:
            dept_stress[dept] = {"total_score": 0, "count": 0}
        dept_stress[dept]["total_score"] += score
        dept_stress[dept]["count"] += 1

        c_tech = (s["coping_technique"] or "Box Breathing").split("&")[0].strip()
        coping_adoption[c_tech] = coping_adoption.get(c_tech, 0) + 1

    dept_averages = {d: round(v["total_score"] / v["count"], 1) for d, v in dept_stress.items()}
    avg_campus_stress = round(total_stress_score / len(students), 1) if students else 15.0

    conn.close()

    return {
        "collegeCode": collegeCode,
        "totalStudents": len(students),
        "totalPsychologists": len(doctors),
        "averageCampusStressScore": avg_campus_stress,
        "stressDistribution": stress_distribution,
        "departmentStressAverages": dept_averages,
        "copingMechanismsAdoption": coping_adoption,
        "highRiskAlerts": stress_distribution["High"] + stress_distribution["Severe"]
    }


# ----------------- STATIC FILES AND ROOT -----------------

@app.get("/")
async def root():
    landing_file = os.path.join(FRONTEND_DIR, "landing.html")
    if os.path.exists(landing_file):
        return FileResponse(landing_file)
    return {"message": "PsyShell Backend Active"}

# Mount frontend directory for static serving
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

# Wrap FastAPI with Socket.IO ASGI app
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
