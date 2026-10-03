const { db } = require('../config/db');

exports.getAllClasses = (req, res) => {
  try {
    const classes = db.prepare(`
      SELECT 
        c.*,
        t.name AS teacher_name,
        t.email AS teacher_email,
        (SELECT COUNT(*) FROM students s WHERE s.class_id = c.class_id) AS student_count
      FROM classes c
      LEFT JOIN teachers t ON c.teacher_id = t.teacher_id
      ORDER BY c.class_name ASC, c.section ASC
    `).all();

    return res.json({ success: true, count: classes.length, data: classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch classes' });
  }
};

exports.getClassById = (req, res) => {
  try {
    const { id } = req.params;
    const classItem = db.prepare(`
      SELECT 
        c.*,
        t.name AS teacher_name,
        t.email AS teacher_email
      FROM classes c
      LEFT JOIN teachers t ON c.teacher_id = t.teacher_id
      WHERE c.class_id = ?
    `).get(id);

    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const students = db.prepare(`
      SELECT s.*, 
        (SELECT ROUND(AVG(CASE WHEN a.status = 'Present' THEN 100.0 WHEN a.status = 'Late' THEN 75.0 ELSE 0.0 END), 1)
         FROM attendance a WHERE a.student_id = s.student_id) AS attendance_rate
      FROM students s
      WHERE s.class_id = ?
      ORDER BY s.name ASC
    `).all(id);

    return res.json({
      success: true,
      data: {
        ...classItem,
        students
      }
    });
  } catch (error) {
    console.error('Error fetching class details:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch class details' });
  }
};

exports.createClass = (req, res) => {
  try {
    const { class_name, section, room_number, teacher_id } = req.body;

    if (!class_name || !section) {
      return res.status(400).json({ success: false, message: 'Class name and section are required' });
    }

    const result = db.prepare(`
      INSERT INTO classes (class_name, section, room_number, teacher_id)
      VALUES (?, ?, ?, ?)
    `).run(class_name.trim(), section.trim().toUpperCase(), room_number || null, teacher_id || null);

    const created = db.prepare('SELECT * FROM classes WHERE class_id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ success: true, message: 'Class created', data: created });
  } catch (error) {
    console.error('Error creating class:', error);
    return res.status(500).json({ success: false, message: 'Failed to create class' });
  }
};

exports.updateClass = (req, res) => {
  try {
    const { id } = req.params;
    const { class_name, section, room_number, teacher_id } = req.body;

    const classItem = db.prepare('SELECT * FROM classes WHERE class_id = ?').get(id);
    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    db.prepare(`
      UPDATE classes
      SET class_name = ?, section = ?, room_number = ?, teacher_id = ?
      WHERE class_id = ?
    `).run(
      class_name || classItem.class_name,
      section ? section.trim().toUpperCase() : classItem.section,
      room_number !== undefined ? room_number : classItem.room_number,
      teacher_id !== undefined ? teacher_id : classItem.teacher_id,
      id
    );

    const updated = db.prepare('SELECT * FROM classes WHERE class_id = ?').get(id);
    return res.json({ success: true, message: 'Class updated', data: updated });
  } catch (error) {
    console.error('Error updating class:', error);
    return res.status(500).json({ success: false, message: 'Failed to update class' });
  }
};

exports.deleteClass = (req, res) => {
  try {
    const { id } = req.params;
    const classItem = db.prepare('SELECT * FROM classes WHERE class_id = ?').get(id);
    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // Set class_id to NULL on students enrolled
    db.prepare('UPDATE students SET class_id = NULL WHERE class_id = ?').run(id);
    db.prepare('DELETE FROM classes WHERE class_id = ?').run(id);

    return res.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete class' });
  }
};
