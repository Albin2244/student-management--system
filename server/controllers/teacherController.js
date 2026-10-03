const bcrypt = require('bcryptjs');
const { db } = require('../config/db');

exports.getAllTeachers = (req, res) => {
  try {
    const { department, search } = req.query;

    let query = `
      SELECT 
        t.*,
        (SELECT COUNT(*) FROM courses c WHERE c.teacher_id = t.teacher_id) AS course_count,
        (SELECT COUNT(*) FROM classes cl WHERE cl.teacher_id = t.teacher_id) AS class_count
      FROM teachers t
      WHERE 1=1
    `;
    const params = [];

    if (department) {
      query += ` AND t.department = ?`;
      params.push(department);
    }

    if (search) {
      query += ` AND (t.name LIKE ? OR t.email LIKE ? OR t.employee_id LIKE ? OR t.department LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY t.name ASC`;

    const teachers = db.prepare(query).all(...params);
    return res.json({ success: true, count: teachers.length, data: teachers });
  } catch (error) {
    console.error('Error getting teachers:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch teachers' });
  }
};

exports.getTeacherById = (req, res) => {
  try {
    const { id } = req.params;

    const teacher = db.prepare('SELECT * FROM teachers WHERE teacher_id = ?').get(id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const assignedCourses = db.prepare('SELECT * FROM courses WHERE teacher_id = ?').all(id);
    const assignedClasses = db.prepare('SELECT * FROM classes WHERE teacher_id = ?').all(id);

    return res.json({
      success: true,
      data: {
        ...teacher,
        courses: assignedCourses,
        classes: assignedClasses
      }
    });
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch teacher profile' });
  }
};

exports.createTeacher = (req, res) => {
  try {
    const { name, email, phone, department, designation, qualification, password } = req.body;

    if (!name || !email || !department) {
      return res.status(400).json({ success: false, message: 'Name, email, and department are required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }

    const nextEmp = (db.prepare('SELECT COUNT(*) AS count FROM teachers').get().count + 1);
    const employee_id = `EMP${100 + nextEmp}`;

    const defaultPassword = password || 'teacher123';
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

    const result = db.transaction(() => {
      const userRes = db.prepare(`
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, 'teacher')
      `).run(name.trim(), email.trim().toLowerCase(), hashedPassword);

      const teacherRes = db.prepare(`
        INSERT INTO teachers (user_id, employee_id, name, email, phone, department, designation, qualification)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userRes.lastInsertRowid,
        employee_id,
        name.trim(),
        email.trim().toLowerCase(),
        phone || null,
        department.trim(),
        designation || 'Lecturer',
        qualification || null
      );

      return teacherRes.lastInsertRowid;
    })();

    const createdTeacher = db.prepare('SELECT * FROM teachers WHERE teacher_id = ?').get(result);
    return res.status(201).json({
      success: true,
      message: 'Teacher added successfully',
      data: createdTeacher
    });
  } catch (error) {
    console.error('Error creating teacher:', error);
    return res.status(500).json({ success: false, message: 'Failed to create teacher' });
  }
};

exports.updateTeacher = (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, department, designation, qualification } = req.body;

    const teacher = db.prepare('SELECT * FROM teachers WHERE teacher_id = ?').get(id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    db.transaction(() => {
      db.prepare(`
        UPDATE teachers
        SET name = ?, email = ?, phone = ?, department = ?, designation = ?, qualification = ?
        WHERE teacher_id = ?
      `).run(
        name || teacher.name,
        email || teacher.email,
        phone !== undefined ? phone : teacher.phone,
        department || teacher.department,
        designation || teacher.designation,
        qualification !== undefined ? qualification : teacher.qualification,
        id
      );

      if (teacher.user_id) {
        db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(
          name || teacher.name,
          email || teacher.email,
          teacher.user_id
        );
      }
    })();

    const updated = db.prepare('SELECT * FROM teachers WHERE teacher_id = ?').get(id);
    return res.json({ success: true, message: 'Teacher updated successfully', data: updated });
  } catch (error) {
    console.error('Error updating teacher:', error);
    return res.status(500).json({ success: false, message: 'Failed to update teacher' });
  }
};

exports.deleteTeacher = (req, res) => {
  try {
    const { id } = req.params;
    const teacher = db.prepare('SELECT * FROM teachers WHERE teacher_id = ?').get(id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    db.transaction(() => {
      db.prepare('DELETE FROM teachers WHERE teacher_id = ?').run(id);
      if (teacher.user_id) {
        db.prepare('DELETE FROM users WHERE id = ?').run(teacher.user_id);
      }
    })();

    return res.json({ success: true, message: 'Teacher removed successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete teacher' });
  }
};
