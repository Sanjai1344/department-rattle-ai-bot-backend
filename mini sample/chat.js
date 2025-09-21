const express = require('express');
const chatController = require('../controllers/chatController');
const router = express.Router();

router.post('/message', chatController.sendMessage);
router.get('/history/:sessionId', chatController.getConversationHistory);

module.exports = router;