const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/auth');

router.post('/login', adminController.login);
router.post('/change-password', verifyToken, adminController.changePassword);

router.post('/programs', verifyToken, adminController.addProgram);
router.put('/programs/:program_id', verifyToken, adminController.updateProgram);
router.get('/programs', verifyToken, adminController.getPrograms);

router.get('/history', verifyToken, adminController.getHistory); 

module.exports = router;