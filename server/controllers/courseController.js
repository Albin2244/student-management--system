const { db } = require('../config/db');

exports.getAllCourses = (req, res) => {
  try {
    const { department } = req.query;

    let query = `
      SELECT 
        c.*,
        t.name AS teacher_name,
        t.email AS teacher_email,
        (SELECT COUNT(DISTINCT m.student_id) FROM marks m WHERE m.course_id = c.course_id) AS enrolled_students_count,
        (SELECT ROUND(AVG(m.marks_obtained * 100.0 / m.max_marks), 1) FROM marks m WHERE m.course_id = c.course_id) AS average_score
      FROM courses c
      LEFT JOIN teachers t ON c.teacher_id = t.teacher_id
      WHERE 1=1
    `;
    const params = [];

    if (department) {
      query += ` AND c.department = ?`;
      params.push(department);
    }

    query += ` ORDER BY c.course_code ASC`;

    const courses = db.prepare(query).all(...params);
    return res.json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
};

exports.getCourseById = (req, res) => {
  try {
    const { id } = req.params;
    const course = db.prepare(`
      SELECT 
        c.*,
        t.name AS teacher_name,
        t.email AS teacher_email,
        t.department AS teacher_department
      FROM courses c
      LEFT JOIN teachers t ON c.teacher_id = t.teacher_id
      WHERE c.course_id = ?
    `).get(id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const marks = db.prepare(`
      SELECT m.*, s.name AS student_name, s.enrollment_no, cl.class_name, cl.section
      FROM marks m
      JOIN students s ON m.student_id = s.student_id
      LEFT JOIN classes cl ON s.class_id = cl.class_id
      WHERE m.course_id = ?
      ORDER BY m.marks_obtained DESC
    `).all(id);

    return res.json({
      success: true,
      data: {
        ...course,
        marks
      }
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch course details' });
  }
};

exports.createCourse = (req, res) => {
  try {
    const { course_code, course_name, credits, department, teacher_id, description } = req.body;

    if (!course_code || !course_name) {
      return res.status(400).json({ success: false, message: 'Course code and name are required' });
    }

    const existing = db.prepare('SELECT course_id FROM courses WHERE course_code = ?').get(course_code.trim().toUpperCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'A course with this code already exists' });
    }

    const result = db.prepare(`
      INSERT INTO courses (course_code, course_name, credits, department, teacher_id, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      course_code.trim().toUpperCase(),
      course_name.trim(),
      credits || 3,
      department || 'General',
      teacher_id || null,
      description || null
    );

    const created = db.prepare('SELECT * FROM courses WHERE course_id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ success: true, message: 'Course created successfully', data: created });
  } catch (error) {
    console.error('Error creating course:', error);
    return res.status(500).json({ success: false, message: 'Failed to create course' });
  }
};

exports.updateCourse = (req, res) => {
  try {
    const { id } = req.params;
    const { course_code, course_name, credits, department, teacher_id, description } = req.body;

    const course = db.prepare('SELECT * FROM courses WHERE course_id = ?').get(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    db.prepare(`
      UPDATE courses
      SET course_code = ?, course_name = ?, credits = ?, department = ?, teacher_id = ?, description = ?
      WHERE course_id = ?
    `).run(
      course_code ? course_code.trim().toUpperCase() : course.course_code,
      course_name ? course_name.trim() : course.course_name,
      credits !== undefined ? credits : course.credits,
      department !== undefined ? department : course.department,
      teacher_id !== undefined ? teacher_id : course.teacher_id,
      description !== undefined ? description : course.description,
      id
    );

    const updated = db.prepare('SELECT * FROM courses WHERE course_id = ?').get(id);
    return res.json({ success: true, message: 'Course updated', data: updated });
  } catch (error) {
    console.error('Error updating course:', error);
    return res.status(500).json({ success: false, message: 'Failed to update course' });
  }
};

exports.deleteCourse = (req, res) => {
  try {
    const { id } = req.params;
    const course = db.prepare('SELECT * FROM courses WHERE course_id = ?').get(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    db.prepare('DELETE FROM courses WHERE course_id = ?').run(id);
    return res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete course' });
  }
};
