# EduPulse – Student Management System (SMS)

A full-stack, enterprise-grade Student Management System built following the specifications in [Student Management System Architecture](file:///c:/Users/albin/OneDrive/Desktop/learning/Student_Management_System_Architecture.md).

---

## 🌟 Key Features

- **Multi-Role Authentication (JWT)**:
  - 👑 **Admin**: Complete system control, student enrollment, faculty management, curriculum & classroom configuration, global analytics.
  - 👨‍🏫 **Teacher**: Classroom supervision, course oversight, daily attendance register, batch exam grading.
  - 🎓 **Student**: Academic dashboard, real-time attendance ledger, official grades transcript, and printable report cards.
- **Student Management (CRUD)**:
  - Add, edit, filter by cohort and gender, search by name/email/enrollment, and view comprehensive student profiles.
- **Faculty Directory**:
  - Departmental faculty profiles, designation, qualifications, and supervised courses/classes.
- **Classrooms & Batches**:
  - Section allocations, room assignments, faculty mentor pairing, and live student rosters.
- **Curriculum & Courses**:
  - Course codes, credit units, departmental alignment, and assigned instructors.
- **Daily Attendance Register**:
  - Interactive daily presence register with "All Present" / "All Absent" shortcuts, status buttons (`Present`, `Late`, `Absent`, `Excused`), and remarks.
- **Examinations & Gradebook**:
  - Real-time grade calculation (`A+`, `A`, `B`, `C`, `D`, `F`), batch exam grading, and student academic transcripts.
- **Institutional Analytics & Reports**:
  - Grade distribution charts, 7-day attendance trends, Dean's Honor Roll leaderboard, CSV export, and printable report cards (`window.print()`).

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React (Vite), React Router DOM, Axios, Lucide Icons, Custom CSS Design System |
| **Backend API** | Node.js, Express, CORS, Morgan, dotenv |
| **Authentication** | JWT (JSON Web Tokens) with Bcrypt password hashing |
| **Database** | SQLite (`better-sqlite3`) — Zero setup, relational schema matching architecture specs |

---

## 🔑 Demo Login Accounts

Quick 1-click login buttons are available on the login screen for instant testing:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@sms.com` | `admin123` | Full administrative access |
| **Teacher** | `teacher@sms.com` | `teacher123` | Faculty dashboard, attendance, grading |
| **Student** | `student@sms.com` | `student123` | Personal records, attendance, report cards |

---

## 🚀 How to Run Locally

### 1. Backend Server
```bash
cd server
npm install
npm start
```
- Server runs on: `http://localhost:5000`
- Seed data automatically populates on first start into `server/database.sqlite`.

### 2. Frontend Client
```bash
cd client
npm install
npm run dev
```
- Client runs on: `http://localhost:3000`
- API calls to `/api` are automatically proxied to `http://localhost:5000`.

---

## 🗄️ Database Schema

- `users` (id, name, email, password, role, avatar, created_at)
- `teachers` (teacher_id, user_id, employee_id, name, email, phone, department, designation, qualification)
- `classes` (class_id, class_name, section, room_number, teacher_id)
- `students` (student_id, user_id, enrollment_no, name, email, phone, gender, dob, class_id, address, guardian_name, guardian_phone)
- `courses` (course_id, course_code, course_name, credits, department, teacher_id, description)
- `attendance` (attendance_id, student_id, class_id, date, status, remarks)
- `marks` (mark_id, student_id, course_id, exam_type, marks_obtained, max_marks, grade, comments, exam_date)

---

## 📡 REST API Endpoints

### Authentication
- `POST /api/auth/login` – Authenticate user and receive JWT
- `GET /api/auth/me` – Retrieve current session profile
- `PUT /api/auth/change-password` – Change account password

### Students
- `GET /api/students` – List students (supports `search`, `class_id`, `gender`)
- `GET /api/students/:id` – Student profile with attendance & marks
- `POST /api/students` – Enroll new student (Admin)
- `PUT /api/students/:id` – Update student details (Admin)
- `DELETE /api/students/:id` – Delete student record (Admin)

### Teachers
- `GET /api/teachers` – Faculty directory
- `POST /api/teachers` – Add faculty member (Admin)
- `PUT /api/teachers/:id` – Update faculty (Admin)
- `DELETE /api/teachers/:id` – Remove faculty (Admin)

### Classes & Courses
- `GET /api/classes`, `POST /api/classes`, `PUT /api/classes/:id`, `DELETE /api/classes/:id`
- `GET /api/courses`, `POST /api/courses`, `PUT /api/courses/:id`, `DELETE /api/courses/:id`

### Attendance
- `GET /api/attendance` – Attendance logs
- `POST /api/attendance/batch` – Record class attendance batch
- `GET /api/attendance/student/:id` – Individual student attendance ledger
- `GET /api/attendance/overview` – Institutional attendance statistics

### Marks & Gradebook
- `GET /api/marks` – Examination marks ledger
- `POST /api/marks/batch` – Submit class examination marks
- `GET /api/marks/report-card/:studentId` – Generate full student academic transcript
