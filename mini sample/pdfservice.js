const pdf = require('pdf-parse');
const fs = require('fs').promises;
const mammoth = require('mammoth');

class DocumentService {
  async extractTextFromPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      
      return {
        text: data.text,
        pages: data.numpages,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  async extractTextFromDocx(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return {
        text: result.value,
        metadata: { hasImages: result.messages.length > 0 }
      };
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error('Failed to extract text from DOCX');
    }
  }

  async extractTextFromPPT(filePath) {
    // For PPT files, we'll use a simple text extraction
    // In production, you might want to use specialized libraries
    try {
      // This is a placeholder - you may need additional libraries for PPT
      return {
        text: 'PPT text extraction requires additional setup. Please convert to PDF for better results.',
        metadata: { type: 'ppt', extractionMethod: 'placeholder' }
      };
    } catch (error) {
      console.error('PPT extraction error:', error);
      throw new Error('Failed to extract text from PPT');
    }
  }

  getFileType(filename) {
    const extension = filename.toLowerCase().split('.').pop();
    const typeMap = {
      'pdf': 'pdf',
      'doc': 'doc',
      'docx': 'docx',
      'ppt': 'ppt',
      'pptx': 'pptx',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'bmp': 'image'
    };
    
    return typeMap[extension] || 'unknown';
  }
}

module.exports = new DocumentService();