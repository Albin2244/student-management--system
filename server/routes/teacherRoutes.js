const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', teacherController.getAllTeachers);
router.get('/:id', teacherController.getTeacherById);
router.post('/', authorizeRoles('admin'), teacherController.createTeacher);
router.put('/:id', authorizeRoles('admin'), teacherController.updateTeacher);
router.delete('/:id', authorizeRoles('admin'), teacherController.deleteTeacher);

module.exports = router;
