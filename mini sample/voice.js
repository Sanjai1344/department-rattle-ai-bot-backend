import express from "express";
import voiceController from "../controllers/voiceController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/transcribe", upload.single("audio"), voiceController.processVoiceInput);
router.post("/synthesize", voiceController.generateVoiceResponse);

export default router;
