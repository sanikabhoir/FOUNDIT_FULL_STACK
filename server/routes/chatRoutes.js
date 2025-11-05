const express = require('express');
const { 
    startChat, 
    getChatDetails, 
    updateChatStatus, 
    sendMessage,
    getAllReports,
    processReport
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// ⚠️ IMPORTANT: Report routes MUST come BEFORE /:chatId routes!
// Otherwise Express will treat "reports" as a chatId parameter

// Report routes (Admin only)
router.get('/reports', protect, getAllReports);
router.put('/reports/:reportId', protect, processReport);

// Chat routes
router.post('/start', protect, startChat);
router.get('/:chatId', protect, getChatDetails);
router.put('/:chatId/status', protect, updateChatStatus);
router.post('/:chatId/messages', protect, sendMessage);

module.exports = router;