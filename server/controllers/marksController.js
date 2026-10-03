const { db, calculateGrade } = require('../config/db');

exports.getAllMarks = (req, res) => {
  try {
    const { course_id, student_id, exam_type, class_id } = req.query;

    let query = `
      SELECT 
        m.*,
        s.name AS student_name,
        s.enrollment_no,
        s.class_id,
        cl.class_name,
        cl.section,
        c.course_name,
        c.course_code,
        c.credits
      FROM marks m
      JOIN students s ON m.student_id = s.student_id
      LEFT JOIN classes cl ON s.class_id = cl.class_id
      JOIN courses c ON m.course_id = c.course_id
      WHERE 1=1
    `;
    const params = [];

    if (course_id) {
      query += ` AND m.course_id = ?`;
      params.push(course_id);
    }

    if (student_id) {
      query += ` AND m.student_id = ?`;
      params.push(student_id);
    }

    if (exam_type) {
      query += ` AND m.exam_type = ?`;
      params.push(exam_type);
    }

    if (class_id) {
      query += ` AND s.class_id = ?`;
      params.push(class_id);
    }

    query += ` ORDER BY m.created_at DESC`;

    const records = db.prepare(query).all(...params);
    return res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    console.error('Error fetching marks:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve marks' });
  }
};

exports.createMark = (req, res) => {
  try {
    const { student_id, course_id, exam_type, marks_obtained, max_marks, comments, exam_date } = req.body;

    if (!student_id || !course_id || !exam_type || marks_obtained === undefined) {
      return res.status(400).json({ success: false, message: 'student_id, course_id, exam_type, and marks_obtained are required' });
    }

    const totalMax = Number(max_marks) || 100;
    const obtained = Number(marks_obtained);
    const percentage = (obtained / totalMax) * 100;
    const grade = calculateGrade(percentage);

    const result = db.prepare(`
      INSERT INTO marks (student_id, course_id, exam_type, marks_obtained, max_marks, grade, comments, exam_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      student_id,
      course_id,
      exam_type,
      obtained,
      totalMax,
      grade,
      comments || null,
      exam_date || new Date().toISOString().split('T')[0]
    );

    const created = db.prepare('SELECT * FROM marks WHERE mark_id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ success: true, message: 'Mark recorded successfully', data: created });
  } catch (error) {
    console.error('Error creating mark:', error);
    return res.status(500).json({ success: false, message: 'Failed to record mark' });
  }
};

exports.createBatchMarks = (req, res) => {
  try {
    const { course_id, exam_type, max_marks, exam_date, entries } = req.body;

    if (!course_id || !exam_type || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'course_id, exam_type, and entries are required' });
    }

    const totalMax = Number(max_marks) || 100;
    const date = exam_date || new Date().toISOString().split('T')[0];

    const insertStmt = db.prepare(`
      INSERT INTO marks (student_id, course_id, exam_type, marks_obtained, max_marks, grade, comments, exam_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const runBatch = db.transaction((list) => {
      for (const item of list) {
        const obtained = Number(item.marks_obtained);
        const grade = calculateGrade((obtained / totalMax) * 100);
        insertStmt.run(item.student_id, course_id, exam_type, obtained, totalMax, grade, item.comments || null, date);
      }
    });

    runBatch(entries);

    return res.json({ success: true, message: `Recorded marks for ${entries.length} students` });
  } catch (error) {
    console.error('Error in batch marks:', error);
    return res.status(500).json({ success: false, message: 'Failed to save batch marks' });
  }
};

exports.updateMark = (req, res) => {
  try {
    const { id } = req.params;
    const { marks_obtained, max_marks, exam_type, comments } = req.body;

    const existing = db.prepare('SELECT * FROM marks WHERE mark_id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Mark record not found' });
    }

    const totalMax = max_marks !== undefined ? Number(max_marks) : existing.max_marks;
    const obtained = marks_obtained !== undefined ? Number(marks_obtained) : existing.marks_obtained;
    const grade = calculateGrade((obtained / totalMax) * 100);

    db.prepare(`
      UPDATE marks
      SET marks_obtained = ?, max_marks = ?, grade = ?, exam_type = ?, comments = ?
      WHERE mark_id = ?
    `).run(
      obtained,
      totalMax,
      grade,
      exam_type || existing.exam_type,
      comments !== undefined ? comments : existing.comments,
      id
    );

    const updated = db.prepare('SELECT * FROM marks WHERE mark_id = ?').get(id);
    return res.json({ success: true, message: 'Mark updated', data: updated });
  } catch (error) {
    console.error('Error updating mark:', error);
    return res.status(500).json({ success: false, message: 'Failed to update mark' });
  }
};

exports.deleteMark = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM marks WHERE mark_id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Mark record not found' });
    }

    db.prepare('DELETE FROM marks WHERE mark_id = ?').run(id);
    return res.json({ success: true, message: 'Mark record removed' });
  } catch (error) {
    console.error('Error deleting mark:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete mark' });
  }
};

exports.getStudentReportCard = (req, res) => {
  try {
    const studentId = req.params.studentId || req.user.student_id;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID required' });
    }

    const student = db.prepare(`
      SELECT s.*, c.class_name, c.section, c.room_number, t.name AS class_teacher
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.class_id
      LEFT JOIN teachers t ON c.teacher_id = t.teacher_id
      WHERE s.student_id = ?
    `).get(studentId);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const marks = db.prepare(`
      SELECT m.*, c.course_name, c.course_code, c.credits, t.name AS instructor
      FROM marks m
      JOIN courses c ON m.course_id = c.course_id
      LEFT JOIN teachers t ON c.teacher_id = t.teacher_id
      WHERE m.student_id = ?
      ORDER BY c.course_name ASC, m.exam_date DESC
    `).all(studentId);

    const attendance = db.prepare(`
      SELECT 
        COUNT(*) AS total_days,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present_days,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late_days,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent_days,
        ROUND(AVG(CASE WHEN status = 'Present' THEN 100.0 WHEN status = 'Late' THEN 75.0 ELSE 0.0 END), 1) AS attendance_rate
      FROM attendance
      WHERE student_id = ?
    `).get(studentId);

    // Calculate GPA / summary
    let totalMarks = 0;
    let totalMax = 0;
    marks.forEach(m => {
      totalMarks += m.marks_obtained;
      totalMax += m.max_marks;
    });

    const overallPercentage = totalMax > 0 ? ((totalMarks / totalMax) * 100).toFixed(1) : 0;
    const overallGrade = calculateGrade(Number(overallPercentage));

    return res.json({
      success: true,
      data: {
        student,
        marks,
        attendance: attendance || {},
        summary: {
          totalMarks,
          totalMax,
          overallPercentage: Number(overallPercentage),
          overallGrade,
          coursesEvaluated: marks.length
        }
      }
    });
  } catch (error) {
    console.error('Error generating report card:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate report card' });
  }
};
