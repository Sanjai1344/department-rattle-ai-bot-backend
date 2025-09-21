import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Fallback axios client (still used for files, voice, health, etc.)
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Configure Gemini
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

class ApiService {
  // Chat endpoints (using Gemini directly)
  async sendMessage(message, sessionId, userId = "anonymous", language = "english") {
    try {
      const result = await geminiModel.generateContent(message);
      return {
        success: true,
        data: {
          sessionId,
          userId,
          language,
          reply: result.response.text(),
        },
      };
    } catch (err) {
      console.error("Gemini Error:", err);
      return { success: false, error: err.message };
    }
  }

  async getChatHistory(sessionId) {
    // If you need persistence, call backend
    const response = await apiClient.get(`/chat/history/${sessionId}`);
    return response.data;
  }

  // File endpoints (still handled by backend)
  async uploadFile(file, onProgress) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", "anonymous");
    formData.append("department", "AI_DS");

    const response = await apiClient.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  }

  async getDocuments(department = "AI_DS", limit = 20) {
    const response = await apiClient.get("/files/list", { params: { department, limit } });
    return response.data;
  }

  async searchDocuments(query, department = "AI_DS") {
    const response = await apiClient.get("/files/search", { params: { query, department } });
    return response.data;
  }

  // Voice endpoints (still handled by backend)
  async transcribeAudio(audioBlob) {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");

    const response = await apiClient.post("/voice/transcribe", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  async synthesizeText(text, language = "en") {
    const response = await apiClient.post("/voice/synthesize", { text, language });
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await apiClient.get("/health");
    return response.data;
  }
}

export default new ApiService();
