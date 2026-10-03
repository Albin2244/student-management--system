const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

// Accessible by Admin and Teacher
router.get('/', authorizeRoles('admin', 'teacher'), studentController.getAllStudents);
router.post('/', authorizeRoles('admin'), studentController.createStudent);
router.get('/:id', authorizeRoles('admin', 'teacher', 'student'), studentController.getStudentById);
router.put('/:id', authorizeRoles('admin'), studentController.updateStudent);
router.delete('/:id', authorizeRoles('admin'), studentController.deleteStudent);

module.exports = router;
