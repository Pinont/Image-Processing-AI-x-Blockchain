import React, { useState, useCallback } from 'react';
import './ImageUpload.css';

interface UploadedImage {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  url: string;
}

const ImageUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
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
    setUploadedImage(null);

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

  // Upload removed: external integration deleted
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(false);
    setError('Upload disabled: external upload integration removed.');
  };

  // Reset form
  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadedImage(null);
    setError(null);
  };

  // Copy IPFS hash to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="image-upload-container">
      <div className="upload-card">
        <h2 className="upload-title">Upload Image to IPFS</h2>
        <p className="upload-subtitle">Decentralized image storage</p>

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

            {!uploadedImage && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="upload-button"
              >
                {uploading ? (
                  <>
                    <span className="spinner"></span>
                    Uploading...
                  </>
                ) : (
                  'Upload to IPFS'
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

        {/* Success Message with IPFS Details */}
        {uploadedImage && (
          <div className="success-container">
            <div className="success-badge">
              <svg className="success-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <span>Upload Successful!</span>
            </div>

            <div className="ipfs-details">
              <div className="detail-row">
                <span className="detail-label">IPFS Hash:</span>
                <div className="detail-value-container">
                  <span className="detail-value">{uploadedImage.IpfsHash}</span>
                  <button
                    onClick={() => copyToClipboard(uploadedImage.IpfsHash)}
                    className="copy-button"
                    aria-label="Copy IPFS hash"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="detail-row">
                <span className="detail-label">Size:</span>
                <span className="detail-value">{(uploadedImage.PinSize / 1024).toFixed(2)} KB</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Gateway URL:</span>
                <a
                  href={uploadedImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gateway-link"
                >
                  View on IPFS Gateway
                  <svg className="external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            <button onClick={handleReset} className="upload-another-button">
              Upload Another Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
