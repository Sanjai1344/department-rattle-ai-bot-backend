const { OpenAI } = require('openai');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async getChatResponse(messages, context = {}) {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      
      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  buildSystemPrompt(context) {
    let prompt = `You are "Department Rattle AI Bot", a helpful departmental assistant for an AI and Data Science department. 

Guidelines:
- Be friendly, informative, and concise
- Help with academic queries, department information, and document-related questions
- Support both English and casual Tamil (Tanglish style)
- If asked in Tamil, respond in Tamil/Tanglish mix
- For technical topics, provide clear explanations suitable for students`;

    if (context.documentContext) {
      prompt += `\n\nDocument Context:\n${context.documentContext}`;
    }

    if (context.language === 'tamil') {
      prompt += `\n\nRespond in Tamil/Tanglish casual style.`;
    }

    return prompt;
  }

  async transcribeAudio(audioBuffer) {
    try {
      const transcription = await this.client.audio.transcriptions.create({
        file: audioBuffer,
        model: 'whisper-1',
        language: 'en'
      });

      return transcription.text;
    } catch (error) {
      console.error('Audio transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }
}

module.exports = new OpenAIService();