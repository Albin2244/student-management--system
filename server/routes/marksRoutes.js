const express = require('express');
const router = express.Router();
const marksController = require('../controllers/marksController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', marksController.getAllMarks);
router.post('/', authorizeRoles('admin', 'teacher'), marksController.createMark);
router.post('/batch', authorizeRoles('admin', 'teacher'), marksController.createBatchMarks);
router.put('/:id', authorizeRoles('admin', 'teacher'), marksController.updateMark);
router.delete('/:id', authorizeRoles('admin'), marksController.deleteMark);
router.get('/report-card/:studentId', marksController.getStudentReportCard);

module.exports = router;
