import sqlite3
import json
import os
import time
from datetime import datetime, timedelta
import random

DB_PATH = os.path.join(os.path.dirname(__file__), "psyshell.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Colleges
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS colleges (
        collegecode TEXT PRIMARY KEY,
        collegename TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    """)

    # Users (Students)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        nickname TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        age INTEGER,
        college TEXT,
        dept TEXT,
        occupation TEXT,
        gender TEXT,
        relationshipstatus TEXT,
        languagesSpoken TEXT,
        token TEXT,
        last_login INTEGER,
        stress_level TEXT,
        stress_score INTEGER,
        anxiety_score INTEGER,
        sleep_score INTEGER,
        coping_technique TEXT,
        resilience_points INTEGER,
        profile TEXT
    )
    """)

    # Doctors (Psychologists)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS doctors (
        uid TEXT PRIMARY KEY,
        nickname TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        area_of_expertise TEXT,
        phonenumber TEXT,
        profile TEXT,
        gender TEXT,
        age INTEGER,
        languages TEXT,
        collegecode TEXT,
        available_days TEXT,
        next_available_time TEXT,
        token TEXT
    )
    """)

    # Mood Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mood_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT NOT NULL,
        date TEXT NOT NULL,
        mood TEXT NOT NULL,
        mood_score INTEGER NOT NULL,
        timestamp INTEGER NOT NULL
    )
    """)

    # Journal Entries
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        timestamp INTEGER NOT NULL
    )
    """)

    # Self Test Results
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS selftest_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT NOT NULL,
        date TEXT NOT NULL,
        stress_score INTEGER NOT NULL,
        anxiety_score INTEGER NOT NULL,
        sleep_score INTEGER NOT NULL,
        mood_score INTEGER NOT NULL,
        raw_results_json TEXT NOT NULL,
        timestamp INTEGER NOT NULL
    )
    """)

    # Posts (Newsfeed / Community)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS posts (
        post_id TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT,
        timestamp INTEGER NOT NULL,
        likes_count INTEGER DEFAULT 0
    )
    """)

    # Post Likes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS post_likes (
        post_id TEXT NOT NULL,
        uid TEXT NOT NULL,
        PRIMARY KEY (post_id, uid)
    )
    """)

    # Post Comments
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS post_comments (
        comment_id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        uid TEXT NOT NULL,
        commenter_name TEXT NOT NULL,
        commenter_profile TEXT,
        is_doctor INTEGER DEFAULT 0,
        comment TEXT NOT NULL,
        timestamp INTEGER NOT NULL
    )
    """)

    # Appointments
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS appointments (
        appointment_id TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        puid TEXT NOT NULL,
        date TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending'
    )
    """)

    # Quiz Questions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quiz_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        college TEXT,
        text TEXT NOT NULL,
        options_json TEXT NOT NULL,
        scores_json TEXT NOT NULL,
        set_category TEXT NOT NULL
    )
    """)

    # Library Books
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS library_books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        image_url TEXT NOT NULL,
        date_created TEXT NOT NULL
    )
    """)

    # Chat Messages
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT NOT NULL,
        receiver TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp INTEGER NOT NULL
    )
    """)

    # Reminders and Clinical Records
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS clinical_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        puid TEXT NOT NULL,
        uid TEXT NOT NULL,
        notes TEXT,
        prescription TEXT,
        reminder_date TEXT,
        timestamp INTEGER NOT NULL
    )
    """)

    conn.commit()
    conn.close()

def seed_data():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if colleges already seeded
    cursor.execute("SELECT COUNT(*) as cnt FROM colleges")
    if cursor.fetchone()["cnt"] > 0:
        conn.close()
        return

    print("Seeding initial data for Student Stress & Coping Mechanisms portal...")

    # 1. Colleges
    colleges = [
        ("COL001", "Apex Institute of Engineering & Technology", "admin@college.edu", "password123"),
        ("COL002", "National Institute of Science & Technology", "admin@nist.edu", "password123"),
        ("COL003", "Metropolitan University of Technology", "admin@metro.edu", "password123")
    ]
    cursor.executemany("INSERT INTO colleges VALUES (?, ?, ?, ?)", colleges)

    # 2. Psychologists (Doctors)
    doctors = [
        (
            "psy_001",
            "Dr. Sarah Mitchell",
            "Dr. Sarah Mitchell, Ph.D.",
            "sarah.mitchell@psyshell.help",
            "password123",
            "Cognitive Behavioral Therapy & Academic Stress",
            "+91 98765 43210",
            "./images/resources/friend-avatar.jpg",
            "Female",
            38,
            json.dumps(["English", "Hindi"]),
            "COL001",
            json.dumps(["Monday", "Wednesday", "Friday"]),
            "Today at 3:00 PM",
            "tok_psy_001"
        ),
        (
            "psy_002",
            "Dr. Arjun Sen",
            "Dr. Arjun Sen, MD (Psychiatry)",
            "arjun.sen@psyshell.help",
            "password123",
            "Sleep Hygiene & Mindful Coping Techniques",
            "+91 98765 43211",
            "./images/resources/friend-avatar2.jpg",
            "Male",
            42,
            json.dumps(["English", "Hindi", "Bengali"]),
            "COL001",
            json.dumps(["Tuesday", "Thursday", "Saturday"]),
            "Tomorrow at 11:00 AM",
            "tok_psy_002"
        ),
        (
            "psy_003",
            "Dr. Priya Deshmukh",
            "Dr. Priya Deshmukh, Psy.D.",
            "priya.deshmukh@psyshell.help",
            "password123",
            "Anxiety Disorders & Breathwork Regulation",
            "+91 98765 43212",
            "./images/resources/friend-avatar3.jpg",
            "Female",
            35,
            json.dumps(["English", "Marathi"]),
            "COL001",
            json.dumps(["Monday", "Tuesday", "Thursday"]),
            "Today at 5:00 PM",
            "tok_psy_003"
        )
    ]
    cursor.executemany("""
    INSERT INTO doctors (uid, nickname, name, email, password, area_of_expertise, phonenumber, profile, gender, age, languages, collegecode, available_days, next_available_time, token)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, doctors)

    # 3. Students specifically representing various Stress Levels & Coping Mechanisms
    # Departments: CSE, ECE, Mechanical, Civil, MBA, Biotechnology
    # Stress Levels: Mild, Moderate, High, Severe
    # Coping Mechanisms: Box Breathing, 4-7-8 Breathing, 5-4-3-2-1 Sensory Grounding, Gratitude Journaling, 21/90 Habit Tracking
    students_data = [
        {
            "uid": "stu_001",
            "nickname": "Rahul Sharma",
            "email": "rahul@college.edu",
            "password": "password123",
            "age": 20,
            "college": "COL001",
            "dept": "Computer Science & Engineering",
            "occupation": "3rd Year B.Tech",
            "gender": "Male",
            "relationshipstatus": "Single",
            "languagesSpoken": ["English", "Hindi"],
            "stress_level": "Moderate",
            "stress_score": 18,
            "anxiety_score": 14,
            "sleep_score": 11,
            "coping_technique": "Box Breathing & 21/90 Habit Routine",
            "resilience_points": 95,
            "profile": "./images/resources/friend-avatar.jpg",
            "mood_pattern": [3, 4, 3, 2, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4]
        },
        {
            "uid": "stu_002",
            "nickname": "Ananya Patel",
            "email": "ananya.patel@college.edu",
            "password": "password123",
            "age": 19,
            "college": "COL001",
            "dept": "Electronics & Communication",
            "occupation": "2nd Year B.Tech",
            "gender": "Female",
            "relationshipstatus": "Single",
            "languagesSpoken": ["English", "Hindi", "Gujarati"],
            "stress_level": "High",
            "stress_score": 26,
            "anxiety_score": 22,
            "sleep_score": 18,
            "coping_technique": "5-4-3-2-1 Sensory Grounding & Breathwork",
            "resilience_points": 70,
            "profile": "./images/resources/friend-avatar2.jpg",
            "mood_pattern": [2, 2, 1, 3, 2, 3, 2, 3, 1, 2, 3, 2, 3, 2]
        },
        {
            "uid": "stu_003",
            "nickname": "Vikram Adithya",
            "email": "vikram.adithya@college.edu",
            "password": "password123",
            "age": 21,
            "college": "COL001",
            "dept": "Mechanical Engineering",
            "occupation": "4th Year B.Tech",
            "gender": "Male",
            "relationshipstatus": "In a Relationship",
            "languagesSpoken": ["English", "Telugu"],
            "stress_level": "Low",
            "stress_score": 9,
            "anxiety_score": 7,
            "sleep_score": 6,
            "coping_technique": "Gratitude Journaling & Evening Running",
            "resilience_points": 140,
            "profile": "./images/resources/friend-avatar3.jpg",
            "mood_pattern": [4, 5, 4, 5, 4, 5, 5, 4, 5, 4, 5, 5, 4, 5]
        },
        {
            "uid": "stu_004",
            "nickname": "Sneha Kulkarni",
            "email": "sneha.kulkarni@college.edu",
            "password": "password123",
            "age": 22,
            "college": "COL001",
            "dept": "MBA (Finance)",
            "occupation": "1st Year MBA",
            "gender": "Female",
            "relationshipstatus": "Single",
            "languagesSpoken": ["English", "Marathi", "Hindi"],
            "stress_level": "High",
            "stress_score": 24,
            "anxiety_score": 20,
            "sleep_score": 15,
            "coping_technique": "4-7-8 Breathing & Progressive Muscle Relaxation",
            "resilience_points": 80,
            "profile": "./images/resources/friend-avatar.jpg",
            "mood_pattern": [2, 3, 2, 3, 1, 2, 3, 2, 4, 3, 2, 3, 2, 3]
        },
        {
            "uid": "stu_005",
            "nickname": "Rohan Mehra",
            "email": "rohan.mehra@college.edu",
            "password": "password123",
            "age": 20,
            "college": "COL001",
            "dept": "Computer Science & Engineering",
            "occupation": "3rd Year B.Tech",
            "gender": "Male",
            "relationshipstatus": "Single",
            "languagesSpoken": ["English", "Punjabi"],
            "stress_level": "Severe",
            "stress_score": 31,
            "anxiety_score": 28,
            "sleep_score": 22,
            "coping_technique": "Daily Clinical Counseling & Belly Breathing",
            "resilience_points": 45,
            "profile": "./images/resources/friend-avatar2.jpg",
            "mood_pattern": [1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1, 2]
        },
        {
            "uid": "stu_006",
            "nickname": "Meera Nair",
            "email": "meera.nair@college.edu",
            "password": "password123",
            "age": 20,
            "college": "COL001",
            "dept": "Biotechnology",
            "occupation": "2nd Year B.Tech",
            "gender": "Female",
            "relationshipstatus": "Single",
            "languagesSpoken": ["English", "Malayalam", "Tamil"],
            "stress_level": "Moderate",
            "stress_score": 17,
            "anxiety_score": 13,
            "sleep_score": 10,
            "coping_technique": "Alternate Nostril Breathing & Mindfulness",
            "resilience_points": 110,
            "profile": "./images/resources/friend-avatar3.jpg",
            "mood_pattern": [3, 4, 4, 3, 4, 3, 4, 5, 4, 3, 4, 4, 3, 4]
        },
        {
            "uid": "stu_007",
            "nickname": "Karthik Reddy",
            "email": "karthik.reddy@college.edu",
            "password": "password123",
            "age": 21,
            "college": "COL001",
            "dept": "Civil Engineering",
            "occupation": "4th Year B.Tech",
            "gender": "Male",
            "relationshipstatus": "Single",
            "languagesSpoken": ["English", "Telugu", "Hindi"],
            "stress_level": "Low",
            "stress_score": 11,
            "anxiety_score": 8,
            "sleep_score": 7,
            "coping_technique": "Affirmation Technique & Sports",
            "resilience_points": 130,
            "profile": "./images/resources/friend-avatar.jpg",
            "mood_pattern": [4, 4, 5, 4, 5, 4, 5, 4, 4, 5, 4, 5, 4, 5]
        },
        {
            "uid": "stu_008",
            "nickname": "Divya Singhania",
            "email": "divya.singhania@college.edu",
            "password": "password123",
            "age": 19,
            "college": "COL001",
            "dept": "Computer Science & Engineering",
            "occupation": "2nd Year B.Tech",
            "gender": "Female",
            "relationshipstatus": "Single",
            "languagesSpoken": ["English", "Hindi"],
            "stress_level": "Moderate",
            "stress_score": 19,
            "anxiety_score": 16,
            "sleep_score": 12,
            "coping_technique": "Box Breathing & 369 Journaling Method",
            "resilience_points": 100,
            "profile": "./images/resources/friend-avatar2.jpg",
            "mood_pattern": [3, 3, 4, 2, 4, 3, 4, 3, 4, 4, 3, 4, 3, 4]
        }
    ]

    now_ts = int(time.time())

    for s in students_data:
        token = f"tok_{s['uid']}"
        last_login_ts = now_ts - random.randint(300, 86400 * 3)
        cursor.execute("""
        INSERT INTO users (uid, nickname, email, password, age, college, dept, occupation, gender, relationshipstatus, languagesSpoken, token, last_login, stress_level, stress_score, anxiety_score, sleep_score, coping_technique, resilience_points, profile)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            s["uid"],
            s["nickname"],
            s["email"],
            s["password"],
            s["age"],
            s["college"],
            s["dept"],
            s["occupation"],
            s["gender"],
            s["relationshipstatus"],
            json.dumps(s["languagesSpoken"]),
            token,
            last_login_ts,
            s["stress_level"],
            s["stress_score"],
            s["anxiety_score"],
            s["sleep_score"],
            s["coping_technique"],
            s["resilience_points"],
            s["profile"]
        ))

        # Generate 14 days of mood logs for student
        base_date = datetime.now() - timedelta(days=13)
        mood_names = {1: "terrible", 2: "sad", 3: "bad", 4: "happy", 5: "amazing"}
        for i, score in enumerate(s["mood_pattern"]):
            log_date = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
            m_name = mood_names.get(score, "happy")
            ts = int((base_date + timedelta(days=i)).timestamp())
            cursor.execute("""
            INSERT INTO mood_logs (uid, date, mood, mood_score, timestamp)
            VALUES (?, ?, ?, ?, ?)
            """, (s["uid"], log_date, m_name, score, ts))

        # Seed initial self-test result
        test_date = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")
        raw_test = {
            "stress": s["stress_score"],
            "anxiety": s["anxiety_score"],
            "sleep issues": s["sleep_score"],
            "Mood": random.randint(2, 5)
        }
        cursor.execute("""
        INSERT INTO selftest_results (uid, date, stress_score, anxiety_score, sleep_score, mood_score, raw_results_json, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            s["uid"],
            test_date,
            s["stress_score"],
            s["anxiety_score"],
            s["sleep_score"],
            raw_test["Mood"],
            json.dumps(raw_test),
            now_ts - 86400 * 2
        ))

        # Seed sample journal entry
        cursor.execute("""
        INSERT INTO journal_entries (uid, question, answer, timestamp)
        VALUES (?, ?, ?, ?)
        """, (
            s["uid"],
            "What triggered your stress today, and what coping mechanism helped you regain focus?",
            f"Felt overwhelmed by upcoming project submissions and lab exams. Practiced {s['coping_technique'].split('&')[0].strip()} for 10 minutes and felt significantly calmer.",
            now_ts - random.randint(3600, 86400)
        ))

    # 4. Appointments
    appointments = [
        ("apt_001", "stu_001", "psy_001", "2026-09-26", "03:00 PM - 03:45 PM", "approved"),
        ("apt_002", "stu_002", "psy_001", "2026-09-27", "11:00 AM - 11:45 AM", "pending"),
        ("apt_003", "stu_005", "psy_001", "2026-09-26", "04:00 PM - 04:45 PM", "approved"),
        ("apt_004", "stu_004", "psy_002", "2026-09-28", "02:00 PM - 02:45 PM", "approved"),
        ("apt_005", "stu_008", "psy_002", "2026-09-29", "10:00 AM - 10:45 AM", "pending")
    ]
    cursor.executemany("INSERT INTO appointments VALUES (?, ?, ?, ?, ?, ?)", appointments)

    # 5. Quiz Assessment Questions (Stress, Anxiety, Sleep, Mood)
    questions = [
        (
            "COL001",
            "During the past 2 weeks, how often have you felt overwhelmed by academic deadlines or examinations?",
            json.dumps(["Never (0-1 days)", "Rarely (2-3 days)", "Frequently (4-7 days)", "Almost Continuously (Daily)"]),
            json.dumps([0, 1, 2, 3]),
            "stress"
        ),
        (
            "COL001",
            "When encountering intense college stress, how effectively are you able to utilize calming coping mechanisms (such as Box Breathing or sensory grounding)?",
            json.dumps(["Very effectively - I quickly regain calm", "Somewhat effectively", "Struggle to apply them under stress", "I don't know any coping mechanisms"]),
            json.dumps([0, 1, 2, 3]),
            "stress"
        ),
        (
            "COL001",
            "How often do you experience sudden nervousness, rapid heartbeat, or anxious panic before tests or class presentations?",
            json.dumps(["Hardly ever", "Only before high-stakes exams", "Multiple times a week", "Daily persistent worry"]),
            json.dumps([0, 1, 2, 3]),
            "anxiety"
        ),
        (
            "COL001",
            "How many hours of restorative, uninterrupted sleep do you typically get on college nights?",
            json.dumps(["7 to 8+ restful hours", "6 to 7 hours", "4 to 5 hours (Tossing/Turning)", "Less than 4 hours (Severe exhaustion)"]),
            json.dumps([0, 1, 2, 3]),
            "sleep issues"
        ),
        (
            "COL001",
            "Over the last week, how often have you felt low motivation, lethargy, or emotional detachment from campus peers?",
            json.dumps(["Rarely or not at all", "A few days", "More than half the days", "Nearly every single day"]),
            json.dumps([0, 1, 2, 3]),
            "Mood"
        ),
        (
            "COL001",
            "How regularly do you integrate positive stress coping rituals (e.g., reflective journaling, breathwork, habit tracking)?",
            json.dumps(["Daily established habit", "2-3 times per week", "Only when at breaking point", "Never practiced"]),
            json.dumps([0, 1, 2, 3]),
            "stress"
        ),
        (
            "COL001",
            "Do you find your mind constantly replaying mistakes, grades, or career worries even when trying to relax?",
            json.dumps(["Rarely", "Occasionally", "Very often", "Almost unmanageable"]),
            json.dumps([0, 1, 2, 3]),
            "anxiety"
        ),
        (
            "COL001",
            "How often does racing bedtime anxiety delay your ability to fall asleep?",
            json.dumps(["Never - sleep easily", "Once a week", "3-4 nights a week", "Every night"]),
            json.dumps([0, 1, 2, 3]),
            "sleep issues"
        )
    ]
    cursor.executemany("""
    INSERT INTO quiz_questions (college, text, options_json, scores_json, set_category)
    VALUES (?, ?, ?, ?, ?)
    """, questions)

    # 6. Library Books (Mental Health, Stress Management & Coping)
    books = [
        (
            "The College Mind: Navigating Academic Stress & Building Resilience",
            "Dr. Elena Rostova",
            "images/resources/book1.jpg",
            "2026-01-15"
        ),
        (
            "Breath & Grounding: Evidence-Based Coping Mechanisms for Students",
            "Marcus Vance, M.S.",
            "images/resources/book2.jpg",
            "2026-02-10"
        ),
        (
            "Overcoming Exam Anxiety: A Cognitive Behavioral Approach",
            "Dr. Sarah Mitchell",
            "images/resources/book3.jpg",
            "2026-03-01"
        ),
        (
            "The Sleep Architecture Guide for Undergraduates",
            "Dr. Arjun Sen",
            "images/resources/book1.jpg",
            "2026-04-20"
        ),
        (
            "Digital Well-being & Peer Pressure in University Life",
            "Kavita Raman",
            "images/resources/book2.jpg",
            "2026-05-12"
        ),
        (
            "The 21/90 Habit Framework: Transforming Daily Student Wellness",
            "James C. Thorne",
            "images/resources/book3.jpg",
            "2026-06-18"
        )
    ]
    cursor.executemany("""
    INSERT INTO library_books (title, author, image_url, date_created)
    VALUES (?, ?, ?, ?)
    """, books)

    # 7. Community Posts
    posts = [
        (
            "post_101",
            "stu_001",
            "How Box Breathing Helped Me Ace My Midterm Viva Today!",
            "I used to get crippling heart racing right before professor viva exams. Today, I did 4 cycles of 4-second box breathing (inhale 4, hold 4, exhale 4, hold 4). My heart rate settled immediately, and I could think clearly. Highly recommend giving this a shot if you panic before oral exams!",
            "images/resources/post-1.jpg",
            now_ts - 7200,
            12
        ),
        (
            "post_102",
            "stu_003",
            "Reminder: Taking a 15-minute walk is not 'wasting study time'",
            "We often get trapped in the library for 8 hours straight thinking more screen time = better marks. Your brain needs oxygen and physical movement to consolidate memory. Give yourself permission to breathe and reset.",
            "images/resources/post-2.jpg",
            now_ts - 28000,
            24
        ),
        (
            "post_103",
            "stu_006",
            "5-4-3-2-1 Grounding: The game changer for evening overthinking",
            "When sleep feels impossible because my mind is spiraling about campus placements, listing 5 things I see, 4 I can touch, 3 I hear, 2 I smell, and 1 I taste pulls me right out of anxiety. Hope this helps anyone struggling tonight.",
            "images/resources/post-3.jpg",
            now_ts - 86400,
            19
        )
    ]
    cursor.executemany("""
    INSERT INTO posts (post_id, uid, title, description, image_url, timestamp, likes_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, posts)

    # 8. Post Likes
    cursor.execute("INSERT INTO post_likes VALUES ('post_101', 'stu_002')")
    cursor.execute("INSERT INTO post_likes VALUES ('post_101', 'stu_003')")
    cursor.execute("INSERT INTO post_likes VALUES ('post_102', 'stu_001')")

    # 9. Post Comments (including Psychologist Advice)
    comments = [
        (
            "comm_001",
            "post_101",
            "psy_001",
            "Dr. Sarah Mitchell",
            "./images/resources/friend-avatar.jpg",
            1,
            "Outstanding work, Rahul! Box breathing activates the vagus nerve, immediately shifting your autonomic nervous system from sympathetic (fight/flight) to parasympathetic (rest and digest). Keep up this daily practice.",
            now_ts - 3600
        ),
        (
            "comm_002",
            "post_103",
            "psy_002",
            "Dr. Arjun Sen",
            "./images/resources/friend-avatar2.jpg",
            1,
            "Wonderful technique Meera. Grounding reconnects your prefrontal cortex with current sensory reality, disengaging the amygdala's alarm response.",
            now_ts - 43200
        )
    ]
    cursor.executemany("""
    INSERT INTO post_comments (comment_id, post_id, uid, commenter_name, commenter_profile, is_doctor, comment, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, comments)

    # 10. Sample Chat Messages
    messages = [
        ("stu_001", "psy_001", "Hello Dr. Mitchell, thank you for accepting my appointment. I wanted to discuss coping with project stress.", now_ts - 1800),
        ("psy_001", "stu_001", "Hello Rahul! You are very welcome. We will review your recent mood journal and tailor specific breathwork techniques during our session.", now_ts - 1200)
    ]
    cursor.executemany("INSERT INTO chat_messages (sender, receiver, text, timestamp) VALUES (?, ?, ?, ?)", messages)

    conn.commit()
    conn.close()
    print("Database seeded successfully with rich stress & coping mechanism data!")

if __name__ == "__main__":
    init_db()
    seed_data()
