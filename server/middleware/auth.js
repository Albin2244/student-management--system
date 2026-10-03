const jwt = require('jsonwebtoken');
const { db } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'student_mgmt_system_super_secret_jwt_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch full user record
    const user = db.prepare('SELECT id, name, email, role, avatar FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    // Attach role-specific IDs
    if (user.role === 'student') {
      const student = db.prepare('SELECT student_id, enrollment_no, class_id FROM students WHERE user_id = ?').get(user.id);
      if (student) {
        user.student_id = student.student_id;
        user.enrollment_no = student.enrollment_no;
        user.class_id = student.class_id;
      }
    } else if (user.role === 'teacher') {
      const teacher = db.prepare('SELECT teacher_id, employee_id, department FROM teachers WHERE user_id = ?').get(user.id);
      if (teacher) {
        user.teacher_id = teacher.teacher_id;
        user.employee_id = teacher.employee_id;
        user.department = teacher.department;
      }
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}] roles`
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
  JWT_SECRET
};
