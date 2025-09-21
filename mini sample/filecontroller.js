const Document = require('../models/Document');
const documentService = require('../services/pdfService');
const ocrService = require('../services/ocrService');
const path = require('path');

class FileController {
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { userId = 'anonymous', department = 'AI_DS' } = req.body;
      const file = req.file;
      const fileType = documentService.getFileType(file.originalname);

      // Extract text based on file type
      let extractedText = '';
      let metadata = {};

      try {
        switch (fileType) {
          case 'pdf':
            const pdfResult = await documentService.extractTextFromPDF(file.path);
            extractedText = pdfResult.text;
            metadata = pdfResult.metadata;
            break;

          case 'docx':
            const docxResult = await documentService.extractTextFromDocx(file.path);
            extractedText = docxResult.text;
            metadata = docxResult.metadata;
            break;

          case 'image':
            extractedText = await ocrService.extractTextFromImageWithTamil(file.path);
            metadata = { extractionMethod: 'OCR' };
            break;

          case 'ppt':
          case 'pptx':
            const pptResult = await documentService.extractTextFromPPT(file.path);
            extractedText = pptResult.text;
            metadata = pptResult.metadata;
            break;

          default:
            extractedText = 'Text extraction not supported for this file type';
        }
      } catch (extractionError) {
        console.error('Text extraction failed:', extractionError);
        extractedText = 'Failed to extract text from this file';
      }

      // Save document to database
      const document = new Document({
        filename: file.filename,
        originalName: file.originalname,
        fileType,
        filePath: file.path,
        extractedText,
        uploadedBy: userId,
        department,
        metadata: {
          ...metadata,
          size: file.size
        }
      });

      await document.save();

      res.json({
        message: 'File uploaded and processed successfully',
        documentId: document._id,
        filename: document.originalName,
        extractedTextPreview: extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : ''),
        fileType
      });

    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: 'Failed to process uploaded file' });
    }
  }

  async getDocuments(req, res) {
    try {
      const { department = 'AI_DS', limit = 20 } = req.query;

      const documents = await Document.find({ department })
        .select('originalName fileType createdAt metadata extractedText')
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      const documentsWithPreview = documents.map(doc => ({
        _id: doc._id,
        originalName: doc.originalName,
        fileType: doc.fileType,
        createdAt: doc.createdAt,
        textPreview: doc.extractedText.substring(0, 150) + (doc.extractedText.length > 150 ? '...' : ''),
        metadata: doc.metadata
      }));

      res.json({ documents: documentsWithPreview });

    } catch (error) {
      console.error('Documents retrieval error:', error);
      res.status(500).json({ error: 'Failed to retrieve documents' });
    }
  }

  async searchDocuments(req, res) {
    try {
      const { query, department = 'AI_DS' } = req.query;

      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const documents = await Document.find({
        department,
        $text: { $search: query }
      }).select('originalName fileType extractedText createdAt');

      const results = documents.map(doc => ({
        _id: doc._id,
        originalName: doc.originalName,
        fileType: doc.fileType,
        createdAt: doc.createdAt,
        relevantText: this.extractRelevantText(doc.extractedText, query)
      }));

      res.json({ results, count: results.length });

    } catch (error) {
      console.error('Document search error:', error);
      res.status(500).json({ error: 'Failed to search documents' });
    }
  }

  extractRelevantText(text, query) {
    const words = query.toLowerCase().split(' ');
    const sentences = text.split('. ');
    
    const relevantSentences = sentences.filter(sentence => 
      words.some(word => sentence.toLowerCase().includes(word))
    );

    return relevantSentences.slice(0, 3).join('. ') + (relevantSentences.length > 3 ? '...' : '');
  }
}

module.exports = new FileController();