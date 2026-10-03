const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/admin', authorizeRoles('admin'), dashboardController.getAdminDashboard);
router.get('/teacher', authorizeRoles('teacher', 'admin'), dashboardController.getTeacherDashboard);
router.get('/student', authorizeRoles('student'), dashboardController.getStudentDashboard);

module.exports = router;
