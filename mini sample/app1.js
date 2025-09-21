import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import FileUpload from './components/FileUpload';
import './App.css';
import apiService from './services/apiService';

function App() {
  const [documents, setDocuments] = useState([]);
  const [sessionId] = useState(() => 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
  const [uploadStatus, setUploadStatus] = useState({ message: '', type: '' });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await apiService.getDocuments();
      setDocuments(response.documents);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleFileUpload = async (file, uploadProgress) => {
    try {
      setUploadStatus({ message: 'Uploading file...', type: 'info' });
      const response = await apiService.uploadFile(file, uploadProgress);
      
      setUploadStatus({ 
        message: `✅ ${response.filename} uploaded successfully!`, 
        type: 'success' 
      });
      
      // Reload documents list
      loadDocuments();
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setUploadStatus({ message: '', type: '' });
      }, 3000);
      
    } catch (error) {
      setUploadStatus({ 
        message: `❌ Upload failed: ${error.message}`, 
        type: 'error' 
      });
      
      setTimeout(() => {
        setUploadStatus({ message: '', type: '' });
      }, 3000);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">🤖 Department Rattle AI Bot</h1>
        <p className="app-subtitle">Your AI-powered Departmental Assistant</p>
      </header>

      <div className="main-container">
        <div className="chat-section">
          <ChatInterface sessionId={sessionId} />
        </div>

        <div className="sidebar">
          <FileUpload 
            onFileUpload={handleFileUpload} 
            uploadStatus={uploadStatus}
          />
          
          <div className="documents-section">
            <h3 className="section-title">📚 Knowledge Base</h3>
            <div className="documents-list">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <div key={doc._id} className="document-item">
                    <div className="document-name">{doc.originalName}</div>
                    <div className="document-type">{doc.fileType}</div>
                    <div className="document-preview">
                      {doc.textPreview}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                  No documents uploaded yet. Upload files to build your knowledge base!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;