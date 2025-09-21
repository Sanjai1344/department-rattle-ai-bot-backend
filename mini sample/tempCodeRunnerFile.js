import { GoogleGenerativeAI } from '@google/generative-ai';

// Environment variable validation
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ REACT_APP_GEMINI_API_KEY is not set in environment variables');
  throw new Error('Gemini API key is required. Please set REACT_APP_GEMINI_API_KEY in your .env file');
}

// Configure Gemini AI with error handling
let genAI;
let geminiModel;

try {
  // Initialize Google Generative AI instance
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  // Get the specific Gemini model
  geminiModel = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    // Optional: Add generation config
    generationConfig: {
      temperature: 0.7,        // Controls randomness (0.0 to 1.0)
      topP: 0.8,              // Controls diversity
      topK: 40,               // Limits token selection
      maxOutputTokens: 1024,  // Maximum response length
    },
    // Optional: Add safety settings
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
    ],
  });

  console.log('✅ Gemini AI initialized successfully');
  
} catch (error) {
  console.error('❌ Failed to initialize Gemini AI:', error);
  throw new Error(`Gemini AI initialization failed: ${error.message}`);
}

// Helper function to generate content with error handling
export const generateGeminiResponse = async (prompt, context = '') => {
  try {
    if (!geminiModel) {
      throw new Error('Gemini model is not initialized');
    }

    // Combine context and prompt for better responses
    const fullPrompt = context 
      ? `Context: ${context}\n\nUser Query: ${prompt}` 
      : prompt;

    console.log('🤖 Sending request to Gemini...');
    
    const result = await geminiModel.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('Empty response received from Gemini');
    }

    console.log('✅ Gemini response received successfully');
    return text;

  } catch (error) {
    console.error('❌ Gemini API Error:', error);
    
    // Handle specific error types
    if (error.message.includes('API_KEY')) {
      throw new Error('Invalid API key. Please check your Gemini API key.');
    } else if (error.message.includes('QUOTA')) {
      throw new Error('API quota exceeded. Please try again later.');
    } else if (error.message.includes('SAFETY')) {
      throw new Error('Content was blocked by safety filters. Please rephrase your query.');
    } else {
      throw new Error(`Gemini AI error: ${error.message}`);
    }
  }
};

// Helper function for streaming responses (optional)
export const generateGeminiStreamResponse = async function* (prompt, context = '') {
  try {
    if (!geminiModel) {
      throw new Error('Gemini model is not initialized');
    }

    const fullPrompt = context 
      ? `Context: ${context}\n\nUser Query: ${prompt}` 
      : prompt;

    console.log('🌊 Starting Gemini stream...');
    
    const result = await geminiModel.generateContentStream(fullPrompt);
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        yield chunkText;
      }
    }

    console.log('✅ Gemini stream completed');

  } catch (error) {
    console.error('❌ Gemini Stream Error:', error);
    throw error;
  }
};

// Export the configured instances
export { genAI, geminiModel };

// Example usage in a React component:
/*
import { generateGeminiResponse } from './geminiConfig';

const handleChat = async (userMessage) => {
  try {
    setLoading(true);
    const response = await generateGeminiResponse(
      userMessage, 
      'You are a helpful AI assistant for a university department.'
    );
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
  } catch (error) {
    console.error('Chat error:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
*/