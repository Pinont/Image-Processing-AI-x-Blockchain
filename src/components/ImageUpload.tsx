import React, { useState, useCallback } from 'react';
import EventManager, { EVENTS } from '../managers/EventManager';
import './ImageUpload.css';

const ImageUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setUploadSuccess(false);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Send to chat
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Emit event to ChatBot with the selected file
      EventManager.emit(EVENTS.IMAGE_UPLOADED, selectedFile);
      
      setUploadSuccess(true);
      setUploading(false);
      
      // Close the overlay immediately after sending
      setTimeout(() => {
        EventManager.emit(EVENTS.OVERLAY_CLOSE);
        handleReset();
      }, 800);
    } catch (err) {
      setError('Failed to send image to chat');
      setUploading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadSuccess(false);
    setError(null);
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="image-upload-container">
      <div className="upload-card">
        <h2 className="upload-title">Upload Image to Chat</h2>
        <p className="upload-subtitle">Send image for AI object detection</p>

        {/* Drag and Drop Zone */}
        {!preview && (
          <div
            className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="drop-zone-content">
              <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="drop-text">Drag and drop your image here</p>
              <p className="drop-text-or">or</p>
              <label htmlFor="file-input" className="file-input-label">
                Browse Files
              </label>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="file-input-hidden"
              />
              <p className="file-info">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="preview-container">
            <div className="preview-wrapper">
              <img src={preview} alt="Preview" className="preview-image" />
              <button onClick={handleReset} className="preview-close" aria-label="Remove image">
                ×
              </button>
            </div>
            
            <div className="image-info">
              <p className="image-name">{selectedFile?.name}</p>
              <p className="image-size">
                {selectedFile && (selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>

            {!uploadSuccess && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="upload-button"
              >
                {uploading ? (
                  <>
                    <span className="spinner"></span>
                    Sending...
                  </>
                ) : (
                  'Send to Chat'
                )}
              </button>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <svg className="error-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            {error}
          </div>
        )}

        {/* Success Message */}
        {uploadSuccess && (
          <div className="success-container">
            <div className="success-badge">
              <svg className="success-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <span>Image sent to chat!</span>
            </div>
            <p style={{color: 'rgba(255, 255, 255, 0.7)', marginTop: '1rem', textAlign: 'center'}}>
              Check your chat to see the image and object detection results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
