import React from 'react';

const MessageBubble = ({ message, onPlayAudio }) => {
  const formatMessage = (text) => {
    // Simple formatting for line breaks
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className={`message ${message.role}`}>
      <div className={`message-bubble ${message.role} ${message.isError ? 'error' : ''}`}>
        <div className="message-content">
          {formatMessage(message.content)}
        </div>
        <div className="message-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
          <div className="message-time">{message.timestamp}</div>
          {message.role === 'assistant' && !message.isError && (
            <button
              className="voice-btn speaker"
              onClick={onPlayAudio}
              title="Play audio"
              style={{ width: '25px', height: '25px', fontSize: '0.7rem' }}
            >
              🔊
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;