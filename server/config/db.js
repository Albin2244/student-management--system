const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function initDatabase() {
  // 1. Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'student')),
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Teachers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      teacher_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      employee_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      department TEXT NOT NULL,
      designation TEXT DEFAULT 'Lecturer',
      qualification TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 3. Classes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      class_id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_name TEXT NOT NULL,
      section TEXT NOT NULL,
      room_number TEXT,
      teacher_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(teacher_id) REFERENCES teachers(teacher_id) ON DELETE SET NULL
    );
  `);

  // 4. Students table
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      student_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      enrollment_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
      dob TEXT,
      class_id INTEGER,
      address TEXT,
      guardian_name TEXT,
      guardian_phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(class_id) REFERENCES classes(class_id) ON DELETE SET NULL
    );
  `);

  // 5. Courses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      course_id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_code TEXT UNIQUE NOT NULL,
      course_name TEXT NOT NULL,
      credits INTEGER DEFAULT 3,
      department TEXT,
      teacher_id INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(teacher_id) REFERENCES teachers(teacher_id) ON DELETE SET NULL
    );
  `);

  // 6. Attendance table
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      attendance_id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Present', 'Absent', 'Late', 'Excused')),
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, date),
      FOREIGN KEY(student_id) REFERENCES students(student_id) ON DELETE CASCADE,
      FOREIGN KEY(class_id) REFERENCES classes(class_id) ON DELETE CASCADE
    );
  `);

  // 7. Marks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS marks (
      mark_id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      exam_type TEXT NOT NULL CHECK(exam_type IN ('Midterm', 'Final', 'Quiz', 'Assignment')),
      marks_obtained REAL NOT NULL,
      max_marks REAL NOT NULL DEFAULT 100,
      grade TEXT NOT NULL,
      comments TEXT,
      exam_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(student_id) REFERENCES students(student_id) ON DELETE CASCADE,
      FOREIGN KEY(course_id) REFERENCES courses(course_id) ON DELETE CASCADE
    );
  `);

  seedData();
}

function calculateGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (userCount > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial data into database...');

  const hashedAdminPassword = bcrypt.hashSync('admin123', 10);
  const hashedTeacherPassword = bcrypt.hashSync('teacher123', 10);
  const hashedStudentPassword = bcrypt.hashSync('student123', 10);

  // Insert Admin
  const adminStmt = db.prepare(`
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, ?)
  `);
  adminStmt.run('System Administrator', 'admin@sms.com', hashedAdminPassword, 'admin');

  // Insert Teachers & User accounts
  const teacherList = [
    { name: 'Dr. John Doe', email: 'teacher@sms.com', dept: 'Computer Science', desig: 'Head of Department', qual: 'Ph.D. in AI & CS', phone: '+1-555-0101', empId: 'EMP101' },
    { name: 'Prof. Sarah Smith', email: 'sarah.smith@sms.com', dept: 'Mathematics', desig: 'Senior Professor', qual: 'M.Sc., Ph.D. Applied Math', phone: '+1-555-0102', empId: 'EMP102' },
    { name: 'Dr. David Wilson', email: 'david.wilson@sms.com', dept: 'Physics', desig: 'Associate Professor', qual: 'Ph.D. Quantum Physics', phone: '+1-555-0103', empId: 'EMP103' }
  ];

  const teacherIds = [];
  teacherList.forEach(t => {
    const userRes = adminStmt.run(t.name, t.email, hashedTeacherPassword, 'teacher');
    const teacherRes = db.prepare(`
      INSERT INTO teachers (user_id, employee_id, name, email, phone, department, designation, qualification)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userRes.lastInsertRowid, t.empId, t.name, t.email, t.phone, t.dept, t.desig, t.qual);
    teacherIds.push(teacherRes.lastInsertRowid);
  });

  // Insert Classes
  const classList = [
    { name: 'CS - Year 3', section: 'A', room: 'Lab 401', teacher_id: teacherIds[0] },
    { name: 'CS - Year 3', section: 'B', room: 'Lab 402', teacher_id: teacherIds[0] },
    { name: 'Maths - Year 2', section: 'A', room: 'Hall 205', teacher_id: teacherIds[1] },
    { name: 'Physics - Year 1', section: 'A', room: 'Science Lab 102', teacher_id: teacherIds[2] }
  ];

  const classIds = [];
  classList.forEach(c => {
    const res = db.prepare(`
      INSERT INTO classes (class_name, section, room_number, teacher_id)
      VALUES (?, ?, ?, ?)
    `).run(c.name, c.section, c.room, c.teacher_id);
    classIds.push(res.lastInsertRowid);
  });

  // Insert Courses
  const courseList = [
    { code: 'CS301', name: 'Data Structures & Algorithms', credits: 4, dept: 'Computer Science', teacher_id: teacherIds[0], desc: 'Advanced tree structures, graph algorithms, and dynamic programming' },
    { code: 'CS302', name: 'Database Management Systems', credits: 4, dept: 'Computer Science', teacher_id: teacherIds[0], desc: 'Relational design, normalization, indexing, and SQL/NoSQL architectures' },
    { code: 'MTH201', name: 'Discrete Mathematics', credits: 3, dept: 'Mathematics', teacher_id: teacherIds[1], desc: 'Set theory, combinatorics, graph theory, and proof techniques' },
    { code: 'PHY101', name: 'Engineering Physics', credits: 3, dept: 'Physics', teacher_id: teacherIds[2], desc: 'Electromagnetism, quantum mechanics, and solid-state materials' },
    { code: 'CS303', name: 'Full Stack Web Engineering', credits: 4, dept: 'Computer Science', teacher_id: teacherIds[0], desc: 'Modern reactive frontend and RESTful microservices' }
  ];

  const courseIds = [];
  courseList.forEach(course => {
    const res = db.prepare(`
      INSERT INTO courses (course_code, course_name, credits, department, teacher_id, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(course.code, course.name, course.credits, course.dept, course.teacher_id, course.desc);
    courseIds.push(res.lastInsertRowid);
  });

  // Insert Students & User accounts
  const studentList = [
    { name: 'Albin Antony', email: 'student@sms.com', phone: '+1-555-0201', gender: 'Male', dob: '2004-05-14', class_id: classIds[0], enroll: 'STU202601', guardian: 'Antony Joseph', guardianPhone: '+1-555-0301', address: 'Kochi, Kerala, India' },
    { name: 'Emma Watson', email: 'emma.watson@sms.com', phone: '+1-555-0202', gender: 'Female', dob: '2004-04-15', class_id: classIds[0], enroll: 'STU202602', guardian: 'Chris Watson', guardianPhone: '+1-555-0302', address: 'Oxford Street, London' },
    { name: 'Liam Neeson', email: 'liam.neeson@sms.com', phone: '+1-555-0203', gender: 'Male', dob: '2003-06-07', class_id: classIds[1], enroll: 'STU202603', guardian: 'Bernard Neeson', guardianPhone: '+1-555-0303', address: 'Ballymena, Northern Ireland' },
    { name: 'Sophia Chen', email: 'sophia.chen@sms.com', phone: '+1-555-0204', gender: 'Female', dob: '2004-09-22', class_id: classIds[2], enroll: 'STU202604', guardian: 'Wei Chen', guardianPhone: '+1-555-0304', address: 'Silicon Valley, CA' },
    { name: 'Noah Miller', email: 'noah.miller@sms.com', phone: '+1-555-0205', gender: 'Male', dob: '2005-01-18', class_id: classIds[3], enroll: 'STU202605', guardian: 'James Miller', guardianPhone: '+1-555-0305', address: 'Boston, MA' },
    { name: 'Olivia Davis', email: 'olivia.davis@sms.com', phone: '+1-555-0206', gender: 'Female', dob: '2004-11-30', class_id: classIds[0], enroll: 'STU202606', guardian: 'Robert Davis', guardianPhone: '+1-555-0306', address: 'Seattle, WA' },
    { name: 'Ethan Brown', email: 'ethan.brown@sms.com', phone: '+1-555-0207', gender: 'Male', dob: '2004-08-12', class_id: classIds[1], enroll: 'STU202607', guardian: 'William Brown', guardianPhone: '+1-555-0307', address: 'Chicago, IL' },
    { name: 'Ava Taylor', email: 'ava.taylor@sms.com', phone: '+1-555-0208', gender: 'Female', dob: '2005-03-05', class_id: classIds[3], enroll: 'STU202608', guardian: 'George Taylor', guardianPhone: '+1-555-0308', address: 'Austin, TX' }
  ];

  const studentIds = [];
  studentList.forEach(s => {
    const userRes = adminStmt.run(s.name, s.email, hashedStudentPassword, 'student');
    const stuRes = db.prepare(`
      INSERT INTO students (user_id, enrollment_no, name, email, phone, gender, dob, class_id, address, guardian_name, guardian_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userRes.lastInsertRowid, s.enroll, s.name, s.email, s.phone, s.gender, s.dob, s.class_id, s.address, s.guardian, s.guardianPhone);
    studentIds.push(stuRes.lastInsertRowid);
  });

  // Seed Attendance for the last 7 dates
  const today = new Date();
  const dateStrings = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dateStrings.push(d.toISOString().split('T')[0]);
  }

  const attendanceStmt = db.prepare(`
    INSERT INTO attendance (student_id, class_id, date, status, remarks)
    VALUES (?, ?, ?, ?, ?)
  `);

  const statuses = ['Present', 'Present', 'Present', 'Present', 'Late', 'Absent', 'Present'];
  studentIds.forEach((sId, index) => {
    const student = studentList[index];
    dateStrings.forEach((dStr, dIdx) => {
      // Deterministic realistic pattern
      let stat = statuses[(index + dIdx) % statuses.length];
      if (dIdx === dateStrings.length - 1 && index === 0) stat = 'Present'; // Make demo student present today
      attendanceStmt.run(sId, student.class_id, dStr, stat, stat === 'Late' ? 'Traffic delay' : null);
    });
  });

  // Seed Marks
  const marksStmt = db.prepare(`
    INSERT INTO marks (student_id, course_id, exam_type, marks_obtained, max_marks, grade, comments, exam_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const examData = [
    // Albin Antony (CS)
    { studentIdx: 0, courseIdx: 0, type: 'Midterm', marks: 92, max: 100, date: '2026-09-15', comments: 'Excellent mastery of graph search' },
    { studentIdx: 0, courseIdx: 1, type: 'Midterm', marks: 88, max: 100, date: '2026-09-18', comments: 'Strong normalization concepts' },
    { studentIdx: 0, courseIdx: 4, type: 'Midterm', marks: 95, max: 100, date: '2026-09-22', comments: 'Superb React architecture' },
    { studentIdx: 0, courseIdx: 0, type: 'Quiz', marks: 19, max: 20, date: '2026-09-28', comments: 'Perfect quiz submission' },

    // Emma Watson (CS)
    { studentIdx: 1, courseIdx: 0, type: 'Midterm', marks: 85, max: 100, date: '2026-09-15', comments: 'Very good analysis' },
    { studentIdx: 1, courseIdx: 1, type: 'Midterm', marks: 91, max: 100, date: '2026-09-18', comments: 'Flawless schema design' },
    { studentIdx: 1, courseIdx: 4, type: 'Midterm', marks: 89, max: 100, date: '2026-09-22', comments: 'Clean code & components' },

    // Liam Neeson (CS Class B)
    { studentIdx: 2, courseIdx: 0, type: 'Midterm', marks: 74, max: 100, date: '2026-09-15', comments: 'Solid understanding' },
    { studentIdx: 2, courseIdx: 1, type: 'Midterm', marks: 79, max: 100, date: '2026-09-18', comments: 'Good work on indexing' },

    // Sophia Chen (Maths)
    { studentIdx: 3, courseIdx: 2, type: 'Midterm', marks: 96, max: 100, date: '2026-09-16', comments: 'Exceptional mathematical proofs' },

    // Noah Miller (Physics)
    { studentIdx: 4, courseIdx: 3, type: 'Midterm', marks: 81, max: 100, date: '2026-09-17', comments: 'Great grasp of thermodynamics' },

    // Olivia Davis (CS)
    { studentIdx: 5, courseIdx: 0, type: 'Midterm', marks: 90, max: 100, date: '2026-09-15', comments: 'Outstanding implementation' },
    { studentIdx: 5, courseIdx: 4, type: 'Midterm', marks: 93, max: 100, date: '2026-09-22', comments: 'Creative UI and state management' }
  ];

  examData.forEach(e => {
    const sId = studentIds[e.studentIdx];
    const cId = courseIds[e.courseIdx];
    const percentage = (e.marks / e.max) * 100;
    const grade = calculateGrade(percentage);
    marksStmt.run(sId, cId, e.type, e.marks, e.max, grade, e.comments, e.date);
  });

  console.log('Seeding completed successfully!');
}

initDatabase();

module.exports = {
  db,
  calculateGrade
};
