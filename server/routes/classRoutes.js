const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', classController.getAllClasses);
router.get('/:id', classController.getClassById);
router.post('/', authorizeRoles('admin'), classController.createClass);
router.put('/:id', authorizeRoles('admin'), classController.updateClass);
router.delete('/:id', authorizeRoles('admin'), classController.deleteClass);

module.exports = router;
