import openaiService from "../services/openaiService.js";
import ttsService from "../services/ttsService.js";
import path from "path";

class VoiceController {
  async processVoiceInput(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file uploaded" });
      }

      // Transcribe audio to text
      const transcription = await openaiService.transcribeAudio(req.file.path);

      res.json({
        transcription,
        message: "Voice input processed successfully",
      });
    } catch (error) {
      console.error("Voice processing error:", error);
      res.status(500).json({ error: "Failed to process voice input" });
    }
  }

  async generateVoiceResponse(req, res) {
    try {
      const { text, language = "en" } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      // Detect language if not specified
      const detectedLanguage =
        language === "auto" ? ttsService.detectLanguage(text) : language;

      // Generate TTS audio
      const audioPath = await ttsService.textToSpeech(text, detectedLanguage);
      const audioFilename = path.basename(audioPath);

      res.json({
        audioUrl: `/uploads/${audioFilename}`,
        language: detectedLanguage,
        message: "Voice response generated successfully",
      });
    } catch (error) {
      console.error("TTS generation error:", error);
      res.status(500).json({ error: "Failed to generate voice response" });
    }
  }
}

export default new VoiceController();
