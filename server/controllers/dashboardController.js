const { db } = require('../config/db');

exports.getAdminDashboard = (req, res) => {
  try {
    const totalStudents = db.prepare('SELECT COUNT(*) AS count FROM students').get().count;
    const totalTeachers = db.prepare('SELECT COUNT(*) AS count FROM teachers').get().count;
    const totalCourses = db.prepare('SELECT COUNT(*) AS count FROM courses').get().count;
    const totalClasses = db.prepare('SELECT COUNT(*) AS count FROM classes').get().count;

    // Overall attendance rate
    const attendanceStats = db.prepare(`
      SELECT 
        ROUND(AVG(CASE WHEN status = 'Present' THEN 100.0 WHEN status = 'Late' THEN 75.0 ELSE 0.0 END), 1) AS overall_rate,
        COUNT(*) AS total_records
      FROM attendance
    `).get();

    // Grade distribution for chart
    const gradeDistribution = db.prepare(`
      SELECT grade, COUNT(*) AS count
      FROM marks
      GROUP BY grade
      ORDER BY 
        CASE grade 
          WHEN 'A+' THEN 1 
          WHEN 'A' THEN 2 
          WHEN 'B' THEN 3 
          WHEN 'C' THEN 4 
          WHEN 'D' THEN 5 
          ELSE 6 
        END
    `).all();

    // Attendance trend for chart (last 7 days)
    const attendanceTrend = db.prepare(`
      SELECT 
        date,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent
      FROM attendance
      GROUP BY date
      ORDER BY date ASC
      LIMIT 7
    `).all();

    // Recent Students
    const recentStudents = db.prepare(`
      SELECT s.student_id, s.name, s.email, s.enrollment_no, s.created_at, c.class_name, c.section
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.class_id
      ORDER BY s.student_id DESC
      LIMIT 5
    `).all();

    // Department student distribution
    const departmentDistribution = db.prepare(`
      SELECT 
        COALESCE(c.department, 'Other') AS department,
        COUNT(DISTINCT s.student_id) AS student_count
      FROM courses c
      LEFT JOIN marks m ON m.course_id = c.course_id
      LEFT JOIN students s ON m.student_id = s.student_id
      GROUP BY c.department
    `).all();

    return res.json({
      success: true,
      data: {
        kpis: {
          totalStudents,
          totalTeachers,
          totalCourses,
          totalClasses,
          attendanceRate: attendanceStats.overall_rate || 0
        },
        gradeDistribution,
        attendanceTrend,
        recentStudents,
        departmentDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
};

exports.getTeacherDashboard = (req, res) => {
  try {
    const teacherId = req.user.teacher_id;
    if (!teacherId) {
      return res.status(400).json({ success: false, message: 'Teacher profile not found' });
    }

    const assignedCourses = db.prepare('SELECT * FROM courses WHERE teacher_id = ?').all(teacherId);
    const assignedClasses = db.prepare(`
      SELECT c.*, (SELECT COUNT(*) FROM students s WHERE s.class_id = c.class_id) AS student_count
      FROM classes c
      WHERE c.teacher_id = ?
    `).all(teacherId);

    const totalStudentsTaught = db.prepare(`
      SELECT COUNT(DISTINCT s.student_id) AS count
      FROM students s
      WHERE s.class_id IN (SELECT class_id FROM classes WHERE teacher_id = ?)
    `).get(teacherId).count;

    // Today's attendance stats for teacher's classes
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = db.prepare(`
      SELECT 
        status, COUNT(*) AS count
      FROM attendance
      WHERE class_id IN (SELECT class_id FROM classes WHERE teacher_id = ?)
        AND date = ?
      GROUP BY status
    `).all(teacherId, today);

    // Recent marks submitted
    const recentMarks = db.prepare(`
      SELECT m.*, s.name AS student_name, c.course_name
      FROM marks m
      JOIN students s ON m.student_id = s.student_id
      JOIN courses c ON m.course_id = c.course_id
      WHERE c.teacher_id = ?
      ORDER BY m.created_at DESC
      LIMIT 6
    `).all(teacherId);

    return res.json({
      success: true,
      data: {
        assignedCourses,
        assignedClasses,
        totalStudentsTaught,
        todayAttendance,
        recentMarks
      }
    });
  } catch (error) {
    console.error('Error fetching teacher dashboard:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch teacher dashboard' });
  }
};

exports.getStudentDashboard = (req, res) => {
  try {
    const studentId = req.user.student_id;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student profile not found' });
    }

    const student = db.prepare(`
      SELECT s.*, c.class_name, c.section, c.room_number, t.name AS class_teacher
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.class_id
      LEFT JOIN teachers t ON c.teacher_id = t.teacher_id
      WHERE s.student_id = ?
    `).get(studentId);

    const attendanceSummary = db.prepare(`
      SELECT 
        COUNT(*) AS total_days,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late_count,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent_count,
        ROUND(AVG(CASE WHEN status = 'Present' THEN 100.0 WHEN status = 'Late' THEN 75.0 ELSE 0.0 END), 1) AS attendance_rate
      FROM attendance
      WHERE student_id = ?
    `).get(studentId);

    const recentMarks = db.prepare(`
      SELECT m.*, c.course_name, c.course_code, c.credits
      FROM marks m
      JOIN courses c ON m.course_id = c.course_id
      WHERE m.student_id = ?
      ORDER BY m.created_at DESC
      LIMIT 5
    `).all(studentId);

    const courseCount = db.prepare(`
      SELECT COUNT(DISTINCT course_id) AS count
      FROM marks
      WHERE student_id = ?
    `).get(studentId).count;

    return res.json({
      success: true,
      data: {
        student,
        attendanceSummary: attendanceSummary || { attendance_rate: 0, total_days: 0 },
        recentMarks,
        courseCount
      }
    });
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch student dashboard' });
  }
};
