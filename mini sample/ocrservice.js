const Tesseract = require('tesseract.js');

class OCRService {
  async extractTextFromImage(imagePath, language = 'eng') {
    try {
      console.log(`🔍 Starting OCR for: ${imagePath}`);
      
      const result = await Tesseract.recognize(imagePath, language, {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      return result.data.text;
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  async extractTextFromImageWithTamil(imagePath) {
    try {
      // Try Tamil + English
      const result = await Tesseract.recognize(imagePath, 'tam+eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`Tamil OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      return result.data.text;
    } catch (error) {
      console.log('Tamil OCR failed, falling back to English');
      return this.extractTextFromImage(imagePath, 'eng');
    }
  }
}

module.exports = new OCRService();