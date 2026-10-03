const { db } = require('../config/db');

exports.getAttendance = (req, res) => {
  try {
    const { date, class_id, student_id } = req.query;

    let query = `
      SELECT 
        a.*,
        s.name AS student_name,
        s.enrollment_no,
        s.gender,
        c.class_name,
        c.section
      FROM attendance a
      JOIN students s ON a.student_id = s.student_id
      JOIN classes c ON a.class_id = c.class_id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += ` AND a.date = ?`;
      params.push(date);
    }

    if (class_id) {
      query += ` AND a.class_id = ?`;
      params.push(class_id);
    }

    if (student_id) {
      query += ` AND a.student_id = ?`;
      params.push(student_id);
    }

    query += ` ORDER BY a.date DESC, s.name ASC`;

    const records = db.prepare(query).all(...params);
    return res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve attendance' });
  }
};

exports.recordBatchAttendance = (req, res) => {
  try {
    const { class_id, date, entries } = req.body;

    if (!class_id || !date || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'class_id, date, and entries array are required' });
    }

    const upsertStmt = db.prepare(`
      INSERT INTO attendance (student_id, class_id, date, status, remarks)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(student_id, date) DO UPDATE SET
        status = excluded.status,
        remarks = excluded.remarks,
        class_id = excluded.class_id
    `);

    const updateMany = db.transaction((records) => {
      for (const entry of records) {
        upsertStmt.run(
          entry.student_id,
          class_id,
          date,
          entry.status || 'Present',
          entry.remarks || null
        );
      }
    });

    updateMany(entries);

    return res.json({
      success: true,
      message: `Recorded attendance for ${entries.length} students on ${date}`
    });
  } catch (error) {
    console.error('Error saving batch attendance:', error);
    return res.status(500).json({ success: false, message: 'Failed to record attendance' });
  }
};

exports.getStudentAttendance = (req, res) => {
  try {
    const studentId = req.params.studentId || req.user.student_id;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID not provided' });
    }

    const summary = db.prepare(`
      SELECT 
        COUNT(*) AS total_recorded,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late_count,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent_count,
        SUM(CASE WHEN status = 'Excused' THEN 1 ELSE 0 END) AS excused_count,
        ROUND(AVG(CASE WHEN status = 'Present' THEN 100.0 WHEN status = 'Late' THEN 75.0 ELSE 0.0 END), 1) AS attendance_rate
      FROM attendance
      WHERE student_id = ?
    `).get(studentId);

    const history = db.prepare(`
      SELECT a.*, c.class_name, c.section
      FROM attendance a
      JOIN classes c ON a.class_id = c.class_id
      WHERE a.student_id = ?
      ORDER BY a.date DESC
      LIMIT 30
    `).all(studentId);

    return res.json({
      success: true,
      data: {
        summary: summary || {},
        history
      }
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch student attendance' });
  }
};

exports.getAttendanceOverview = (req, res) => {
  try {
    const dailyStats = db.prepare(`
      SELECT 
        date,
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent,
        ROUND(SUM(CASE WHEN status = 'Present' THEN 1.0 WHEN status = 'Late' THEN 0.75 ELSE 0.0 END) * 100.0 / COUNT(*), 1) AS rate
      FROM attendance
      GROUP BY date
      ORDER BY date ASC
      LIMIT 14
    `).all();

    return res.json({ success: true, data: dailyStats });
  } catch (error) {
    console.error('Error fetching attendance overview:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch attendance statistics' });
  }
};
