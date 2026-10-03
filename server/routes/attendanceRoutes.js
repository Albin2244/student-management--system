const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', attendanceController.getAttendance);
router.post('/batch', authorizeRoles('admin', 'teacher'), attendanceController.recordBatchAttendance);
router.get('/overview', attendanceController.getAttendanceOverview);
router.get('/student/:studentId', attendanceController.getStudentAttendance);

module.exports = router;
