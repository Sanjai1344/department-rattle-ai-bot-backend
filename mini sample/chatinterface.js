import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import VoiceRecorder from './VoiceRecorder';
import apiService from '../services/apiService';

const ChatInterface = ({ sessionId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('english');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
    // Add welcome message
    setMessages([{
      role: 'assistant',
      content: 'Hello! I\'m your Department Rattle AI Bot 🤖\n\nI can help you with:\n• Answering questions about uploaded documents\n• General academic queries\n• Voice interactions\n• Multi-language support (English & Tamil)\n\nHow can I assist you today?',
      timestamp: new Date().toLocaleTimeString()
    }]);
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const history = await apiService.getChatHistory(sessionId);
      if (history.messages && history.messages.length > 0) {
        const formattedMessages = history.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp).toLocaleTimeString()
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (messageText = null) => {
    const textToSend = messageText || inputMessage.trim();
    if (!textToSend) return;

    const userMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await apiService.sendMessage(textToSend, sessionId, 'anonymous', language);
      
      const botMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleVoiceInput = (transcription) => {
    if (transcription) {
      sendMessage(transcription);
    }
  };

  const playBotResponse = async (text) => {
    try {
      const response = await apiService.synthesizeText(text, language === 'tamil' ? 'ta' : 'en');
      if (response.audioUrl) {
        const audio = new Audio(`http://localhost:5000${response.audioUrl}`);
        audio.play();
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>💬 Chat with AI Bot</h2>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
          <button
            className={`btn ${language === 'english' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setLanguage('english')}
            style={{ fontSize: '0.8rem', padding: '5px 15px' }}
          >
            English
          </button>
          <button
            className={`btn ${language === 'tamil' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setLanguage('tamil')}
            style={{ fontSize: '0.8rem', padding: '5px 15px' }}
          >
            தமிழ்
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <MessageBubble
            key={index}
            message={message}
            onPlayAudio={() => message.role === 'assistant' && playBotResponse(message.content)}
          />
        ))}
        {isLoading && (
          <div className="message bot">
            <div className="message-bubble bot">
              <div className="loading">🤔 Thinking...</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            className="message-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={language === 'tamil' ? 'உங்கள் செய்தியை இங்கே தட்டச்சு செய்யுங்கள்...' : 'Type your message here...'}
            disabled={isLoading}
          />
          
          <div className="voice-controls">
            <VoiceRecorder onTranscription={handleVoiceInput} />
          </div>

          <button
            className="send-btn"
            onClick={() => sendMessage()}
            disabled={isLoading || !inputMessage.trim()}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;