const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

exports.login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Role specific details
    let roleDetails = {};
    if (user.role === 'student') {
      const student = db.prepare(`
        SELECT s.*, c.class_name, c.section 
        FROM students s 
        LEFT JOIN classes c ON s.class_id = c.class_id 
        WHERE s.user_id = ?
      `).get(user.id);
      roleDetails = student || {};
    } else if (user.role === 'teacher') {
      const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(user.id);
      roleDetails = teacher || {};
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      ...roleDetails
    };

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
};

exports.getCurrentUser = (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let extra = {};
    if (user.role === 'student') {
      const stu = db.prepare(`
        SELECT s.*, c.class_name, c.section, c.room_number 
        FROM students s 
        LEFT JOIN classes c ON s.class_id = c.class_id 
        WHERE s.user_id = ?
      `).get(user.id);
      extra = stu || {};
    } else if (user.role === 'teacher') {
      const tch = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(user.id);
      extra = tch || {};
    }

    return res.json({
      success: true,
      user: { ...user, ...extra }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, message: 'Error retrieving user profile' });
  }
};

exports.changePassword = (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
    const isMatch = bcrypt.compareSync(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    const hashed = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating password' });
  }
};
