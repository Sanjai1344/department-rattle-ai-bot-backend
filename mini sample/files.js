const express = require('express');
const fileController = require('../controllers/fileController');
const upload = require('../middleware/upload');
const router = express.Router();

router.post('/upload', upload.single('file'), fileController.uploadFile);
router.get('/list', fileController.getDocuments);
router.get('/search', fileController.searchDocuments);

module.exports = router;