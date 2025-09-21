const Conversation = require('../conversation');
const Document = require('../Document');
const openaiService = require('../services/openaiService');

class ChatController {
  async sendMessage(req, res) {
    try {
      const { message, sessionId, userId, language = 'english' } = req.body;

      if (!message || !sessionId) {
        return res.status(400).json({ error: 'Message and sessionId are required' });
      }

      // Find or create conversation
      let conversation = await Conversation.findOne({ sessionId });
      if (!conversation) {
        conversation = new Conversation({
          userId,
          sessionId,
          messages: [],
          context: { language }
        });
      }

      // Add user message
      conversation.messages.push({
        role: 'user',
        content: message,
        metadata: { language }
      });

      // Prepare context for AI
      const context = await this.buildContext(message, conversation);
      
      // Get AI response
      const messages = conversation.messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const aiResponse = await openaiService.getChatResponse(messages, context);

      // Add AI response
      conversation.messages.push({
        role: 'assistant',
        content: aiResponse,
        metadata: { language }
      });

      await conversation.save();

      res.json({
        response: aiResponse,
        sessionId,
        context: context.relatedDocuments ? { hasDocuments: true } : {}
      });

    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Failed to process chat message' });
    }
  }

  async buildContext(message, conversation) {
    const context = {
      language: conversation.context.language
    };

    // Search for relevant documents
    try {
      const documents = await Document.find({
        $text: { $search: message }
      }).limit(3);

      if (documents.length > 0) {
        context.documentContext = documents.map(doc => 
          `Document: ${doc.originalName}\nContent: ${doc.extractedText.substring(0, 500)}...`
        ).join('\n\n');
        
        context.relatedDocuments = documents.map(doc => doc._id);
      }
    } catch (error) {
      console.log('Document search failed:', error.message);
    }

    return context;
  }

  async getConversationHistory(req, res) {
    try {
      const { sessionId } = req.params;
      
      const conversation = await Conversation.findOne({ sessionId })
        .populate('context.relatedDocuments', 'originalName fileType');

      if (!conversation) {
        return res.json({ messages: [] });
      }

      res.json({
        messages: conversation.messages,
        relatedDocuments: conversation.context.relatedDocuments || []
      });

    } catch (error) {
      console.error('History retrieval error:', error);
      res.status(500).json({ error: 'Failed to retrieve conversation history' });
    }
  }
}

module.exports = new ChatController();
