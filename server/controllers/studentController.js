const bcrypt = require('bcryptjs');
const { db } = require('../config/db');

exports.getAllStudents = (req, res) => {
  try {
    const { search, class_id, gender } = req.query;

    let query = `
      SELECT 
        s.*, 
        c.class_name, 
        c.section, 
        c.room_number,
        (
          SELECT ROUND(AVG(CASE WHEN a.status = 'Present' THEN 100.0 WHEN a.status = 'Late' THEN 75.0 ELSE 0.0 END), 1)
          FROM attendance a 
          WHERE a.student_id = s.student_id
        ) AS attendance_rate,
        (
          SELECT ROUND(AVG(m.marks_obtained * 100.0 / m.max_marks), 1)
          FROM marks m
          WHERE m.student_id = s.student_id
        ) AS average_score
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.class_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (s.name LIKE ? OR s.email LIKE ? OR s.enrollment_no LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (class_id) {
      query += ` AND s.class_id = ?`;
      params.push(class_id);
    }

    if (gender) {
      query += ` AND s.gender = ?`;
      params.push(gender);
    }

    query += ` ORDER BY s.student_id ASC`;

    const students = db.prepare(query).all(...params);
    return res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch students' });
  }
};

exports.getStudentById = (req, res) => {
  try {
    const { id } = req.params;

    const student = db.prepare(`
      SELECT 
        s.*, 
        c.class_name, 
        c.section, 
        c.room_number,
        t.name AS class_teacher_name,
        t.email AS class_teacher_email
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.class_id
      LEFT JOIN teachers t ON c.teacher_id = t.teacher_id
      WHERE s.student_id = ?
    `).get(id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Attendance breakdown
    const attendanceStats = db.prepare(`
      SELECT 
        COUNT(*) AS total_days,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late_count,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent_count,
        SUM(CASE WHEN status = 'Excused' THEN 1 ELSE 0 END) AS excused_count
      FROM attendance
      WHERE student_id = ?
    `).get(id);

    // Recent Marks
    const marks = db.prepare(`
      SELECT m.*, c.course_name, c.course_code, c.credits
      FROM marks m
      JOIN courses c ON m.course_id = c.course_id
      WHERE m.student_id = ?
      ORDER BY m.created_at DESC
    `).all(id);

    // Recent attendance records
    const recentAttendance = db.prepare(`
      SELECT * FROM attendance
      WHERE student_id = ?
      ORDER BY date DESC
      LIMIT 10
    `).all(id);

    return res.json({
      success: true,
      data: {
        ...student,
        attendanceStats,
        marks,
        recentAttendance
      }
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch student details' });
  }
};

exports.createStudent = (req, res) => {
  try {
    const { name, email, phone, gender, dob, class_id, address, guardian_name, guardian_phone, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    // Check email uniqueness
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }

    // Generate enrollment number
    const nextNum = (db.prepare('SELECT COUNT(*) AS count FROM students').get().count + 1);
    const enrollment_no = `STU2026${String(nextNum).padStart(3, '0')}`;

    const defaultPassword = password || 'student123';
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

    const insertTransaction = db.transaction(() => {
      // 1. Create User
      const userRes = db.prepare(`
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, 'student')
      `).run(name.trim(), email.trim().toLowerCase(), hashedPassword);

      // 2. Create Student
      const stuRes = db.prepare(`
        INSERT INTO students (user_id, enrollment_no, name, email, phone, gender, dob, class_id, address, guardian_name, guardian_phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userRes.lastInsertRowid,
        enrollment_no,
        name.trim(),
        email.trim().toLowerCase(),
        phone || null,
        gender || 'Male',
        dob || null,
        class_id || null,
        address || null,
        guardian_name || null,
        guardian_phone || null
      );

      return stuRes.lastInsertRowid;
    });

    const newStudentId = insertTransaction();
    const createdStudent = db.prepare('SELECT * FROM students WHERE student_id = ?').get(newStudentId);

    return res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      data: createdStudent
    });
  } catch (error) {
    console.error('Error creating student:', error);
    return res.status(500).json({ success: false, message: 'Failed to create student' });
  }
};

exports.updateStudent = (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, gender, dob, class_id, address, guardian_name, guardian_phone } = req.body;

    const existingStudent = db.prepare('SELECT * FROM students WHERE student_id = ?').get(id);
    if (!existingStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    db.transaction(() => {
      // Update student table
      db.prepare(`
        UPDATE students
        SET name = ?, email = ?, phone = ?, gender = ?, dob = ?, class_id = ?, address = ?, guardian_name = ?, guardian_phone = ?
        WHERE student_id = ?
      `).run(
        name || existingStudent.name,
        email || existingStudent.email,
        phone !== undefined ? phone : existingStudent.phone,
        gender || existingStudent.gender,
        dob || existingStudent.dob,
        class_id !== undefined ? class_id : existingStudent.class_id,
        address !== undefined ? address : existingStudent.address,
        guardian_name !== undefined ? guardian_name : existingStudent.guardian_name,
        guardian_phone !== undefined ? guardian_phone : existingStudent.guardian_phone,
        id
      );

      // Update linked user table if user_id exists
      if (existingStudent.user_id) {
        db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(
          name || existingStudent.name,
          email || existingStudent.email,
          existingStudent.user_id
        );
      }
    })();

    const updated = db.prepare('SELECT * FROM students WHERE student_id = ?').get(id);
    return res.json({ success: true, message: 'Student details updated', data: updated });
  } catch (error) {
    console.error('Error updating student:', error);
    return res.status(500).json({ success: false, message: 'Failed to update student' });
  }
};

exports.deleteStudent = (req, res) => {
  try {
    const { id } = req.params;
    const student = db.prepare('SELECT * FROM students WHERE student_id = ?').get(id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    db.transaction(() => {
      // Delete student record (foreign keys cascade will handle marks & attendance)
      db.prepare('DELETE FROM students WHERE student_id = ?').run(id);

      // Delete user account
      if (student.user_id) {
        db.prepare('DELETE FROM users WHERE id = ?').run(student.user_id);
      }
    })();

    return res.json({ success: true, message: 'Student removed successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete student' });
  }
};
