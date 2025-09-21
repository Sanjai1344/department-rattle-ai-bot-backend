import React, { useState, useRef } from 'react';

const FileUpload = ({ onFileUpload, uploadStatus }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set drag over to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid file type (PDF, PPT, DOC, or Image)');
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size should not exceed 50MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    const progressCallback = (progress) => {
      setUploadProgress(Math.round(progress));
    };

    try {
      if (onFileUpload) {
        await onFileUpload(file, progressCallback);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="file-upload-section">
      <h3 className="section-title">📁 Upload Documents</h3>
      <p className="section-description">
        Upload PDF, PowerPoint, Word documents, or images for AI processing
      </p>
      
      <div
        className={`file-upload-area ${isDragOver ? 'drag-over' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={isUploading}
        />
        
        <div className="upload-icon">
          {isUploading ? '⏳' : isDragOver ? '📤' : '📎'}
        </div>
        
        <div className="upload-text">
          {isUploading ? (
            <>
              <div className="upload-progress-text">Uploading... {uploadProgress}%</div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </>
          ) : isDragOver ? (
            <>
              <div className="primary-text">Drop file here</div>
              <div className="secondary-text">Release to upload</div>
            </>
          ) : (
            <>
              <div className="primary-text">Drag & drop files here or click to browse</div>
              <div className="secondary-text">
                Supported: PDF, PPT, PPTX, DOC, DOCX, Images (Max: 50MB)
              </div>
            </>
          )}
        </div>
        
        {uploadStatus && (
          <div className={`upload-status ${uploadStatus.type}`}>
            {uploadStatus.message}
          </div>
        )}
      </div>

      <div className="upload-tips">
        <h4>💡 Upload Tips</h4>
        <ul>
          <li>Ensure images are clear for better OCR results</li>
          <li>PDFs should not be password-protected</li>
          <li>Use descriptive filenames for easier searching</li>
          <li>Files are automatically processed for AI search</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;