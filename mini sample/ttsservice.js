import gtts from 'node-gtts';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TTSService {
  constructor() {
    this.supportedLanguages = new Set(['en', 'ta', 'hi', 'te', 'ml', 'kn', 'bn', 'gu', 'mr']);
    this.maxTextLength = 5000; // Character limit for TTS
  }

  /**
   * Convert text to speech
   * @param {string} text - Text to convert
   * @param {string} language - Language code (default: 'en')
   * @param {string} outputPath - Optional output file path
   * @returns {Promise<object>} - Returns file info with path and URL
   */
  async textToSpeech(text, language = 'en', outputPath = null) {
    try {
      // Validate inputs
      if (!text || typeof text !== 'string') {
        throw new Error('Text is required and must be a string');
      }

      if (text.trim().length === 0) {
        throw new Error('Text cannot be empty');
      }

      if (text.length > this.maxTextLength) {
        throw new Error(`Text exceeds maximum length of ${this.maxTextLength} characters`);
      }

      // Validate language
      if (!this.supportedLanguages.has(language)) {
        console.warn(`Language '${language}' not supported, falling back to English`);
        language = 'en';
      }

      // Clean text for TTS
      const cleanText = this.cleanTextForTTS(text);

      // Auto-detect language if not specified or if mixed content
      if (language === 'auto' || this.containsMixedLanguages(cleanText)) {
        language = this.detectLanguage(cleanText);
      }

      // Generate output path if not provided
      if (!outputPath) {
        const uploadsDir = path.join(__dirname, '../../uploads');
        await this.ensureDirectoryExists(uploadsDir);
        
        const timestamp = Date.now();
        const filename = `tts_${language}_${timestamp}.mp3`;
        outputPath = path.join(uploadsDir, filename);
      }

      // Create TTS instance
      const tts = gtts(language);

      // Generate speech file
      const filePath = await new Promise((resolve, reject) => {
        tts.save(outputPath, cleanText, (err) => {
          if (err) {
            console.error('TTS Generation Error:', err);
            reject(new Error(`Failed to generate speech: ${err.message}`));
          } else {
            resolve(outputPath);
          }
        });
      });

      // Verify file was created and has content
      const fileStats = await fs.stat(filePath);
      if (fileStats.size === 0) {
        throw new Error('Generated audio file is empty');
      }

      // Return file information
      const filename = path.basename(filePath);
      const relativeUrl = `/uploads/${filename}`;

      return {
        success: true,
        filePath: filePath,
        filename: filename,
        url: relativeUrl,
        language: language,
        textLength: cleanText.length,
        fileSize: fileStats.size,
        duration: this.estimateAudioDuration(cleanText)
      };

    } catch (error) {
      console.error('TTS Service Error:', error);
      throw new Error(`Text-to-speech conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert text to speech in Tamil
   * @param {string} text - Text to convert
   * @param {string} outputPath - Optional output path
   * @returns {Promise<object>} - File information
   */
  async textToSpeechTamil(text, outputPath = null) {
    return this.textToSpeech(text, 'ta', outputPath);
  }

  /**
   * Auto-detect and convert mixed language text
   * @param {string} text - Mixed language text
   * @param {string} outputPath - Optional output path
   * @returns {Promise<object>} - File information
   */
  async textToSpeechAuto(text, outputPath = null) {
    const detectedLanguage = this.detectLanguage(text);
    return this.textToSpeech(text, detectedLanguage, outputPath);
  }

  /**
   * Convert multiple texts to speech (batch processing)
   * @param {Array} textArray - Array of {text, language} objects
   * @returns {Promise<Array>} - Array of file information objects
   */
  async batchTextToSpeech(textArray) {
    const results = [];
    
    for (const item of textArray) {
      try {
        const result = await this.textToSpeech(
          item.text, 
          item.language || 'en'
        );
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          text: item.text.substring(0, 50) + '...'
        });
      }
    }

    return results;
  }

  /**
   * Detect language of the text
   * @param {string} text - Text to analyze
   * @returns {string} - Language code
   */
  detectLanguage(text) {
    if (!text || typeof text !== 'string') return 'en';

    const cleanText = text.toLowerCase();

    // Language detection patterns
    const languagePatterns = {
      'ta': /[\u0B80-\u0BFF]/,           // Tamil
      'hi': /[\u0900-\u097F]/,           // Hindi (Devanagari)
      'te': /[\u0C00-\u0C7F]/,           // Telugu
      'ml': /[\u0D00-\u0D7F]/,           // Malayalam
      'kn': /[\u0C80-\u0CFF]/,           // Kannada
      'bn': /[\u0980-\u09FF]/,           // Bengali
      'gu': /[\u0A80-\u0AFF]/,           // Gujarati
      'mr': /[\u0900-\u097F]/,           // Marathi (shares Devanagari with Hindi)
    };

    // Check each language pattern
    for (const [lang, pattern] of Object.entries(languagePatterns)) {
      if (pattern.test(text)) {
        // For Devanagari script, use additional heuristics
        if (lang === 'hi' || lang === 'mr') {
          // Simple word frequency check for Hindi vs Marathi
          const hindiWords = ['है', 'का', 'की', 'को', 'में', 'से', 'के', 'और', 'यह', 'वह'];
          const marathiWords = ['आहे', 'च्या', 'ची', 'ला', 'मध्ये', 'पासून', 'आणि', 'हा', 'तो'];
          
          const hindiCount = hindiWords.reduce((count, word) => 
            count + (cleanText.includes(word) ? 1 : 0), 0);
          const marathiCount = marathiWords.reduce((count, word) => 
            count + (cleanText.includes(word) ? 1 : 0), 0);
          
          return marathiCount > hindiCount ? 'mr' : 'hi';
        }
        return lang;
      }
    }

    return 'en'; // Default to English
  }

  /**
   * Check if text contains multiple languages
   * @param {string} text - Text to check
   * @returns {boolean} - True if mixed languages detected
   */
  containsMixedLanguages(text) {
    const languagePatterns = [
      /[\u0B80-\u0BFF]/, // Tamil
      /[\u0900-\u097F]/, // Hindi/Devanagari
      /[\u0C00-\u0C7F]/, // Telugu
      /[\u0D00-\u0D7F]/, // Malayalam
      /[\u0C80-\u0CFF]/, // Kannada
      /[a-zA-Z]/,        // English
    ];

    let matchCount = 0;
    for (const pattern of languagePatterns) {
      if (pattern.test(text)) {
        matchCount++;
        if (matchCount > 1) return true;
      }
    }

    return false;
  }

  /**
   * Clean text for better TTS output
   * @param {string} text - Raw text
   * @returns {string} - Cleaned text
   */
  cleanTextForTTS(text) {
    return text
      .replace(/[<>]/g, '') // Remove HTML-like brackets
      .replace(/https?:\/\/[^\s]+/g, 'link') // Replace URLs
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F\u0C80-\u0CFF.,!?;:()-]/g, '') // Keep only letters, numbers, Indian scripts, and basic punctuation
      .trim();
  }

  /**
   * Estimate audio duration based on text length
   * @param {string} text - Input text
   * @returns {number} - Estimated duration in seconds
   */
  estimateAudioDuration(text) {
    // Approximate: 150-200 words per minute for TTS
    const wordsPerMinute = 175;
    const wordCount = text.split(/\s+/).length;
    return Math.ceil((wordCount / wordsPerMinute) * 60);
  }

  /**
   * Ensure directory exists
   * @param {string} dirPath - Directory path
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Delete old TTS files to save space
   * @param {number} maxAgeHours - Max age in hours (default: 24)
   */
  async cleanupOldFiles(maxAgeHours = 24) {
    try {
      const uploadsDir = path.join(__dirname, '../../uploads');
      const files = await fs.readdir(uploadsDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      let deletedCount = 0;

      for (const file of files) {
        if (file.startsWith('tts_') && file.endsWith('.mp3')) {
          const filePath = path.join(uploadsDir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} old TTS files`);
      }

    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * Get service status and statistics
   * @returns {object} - Service information
   */
  getServiceInfo() {
    return {
      serviceName: 'TTS Service',
      supportedLanguages: Array.from(this.supportedLanguages),
      maxTextLength: this.maxTextLength,
      version: '1.0.0'
    };
  }
}

// Create and export singleton instance
const ttsService = new TTSService();
export default ttsService;

// Also export the class if needed
export { TTSService };