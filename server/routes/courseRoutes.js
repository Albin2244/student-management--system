const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);
router.post('/', authorizeRoles('admin'), courseController.createCourse);
router.put('/:id', authorizeRoles('admin', 'teacher'), courseController.updateCourse);
router.delete('/:id', authorizeRoles('admin'), courseController.deleteCourse);

module.exports = router;
