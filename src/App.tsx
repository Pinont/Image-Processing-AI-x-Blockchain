import React, { useState, useEffect } from 'react';
import WaveBackground from './components/WaveBackground';
import UserBar from './components/UserBar';
import WalletConnect from './components/WalletConnect';
import ImageUpload from './components/ImageUpload';
import ChatBot from './components/ChatBot';
import useWallet from './hooks/useWallet';
import './styles/index.css';

const App: React.FC = () => {
  const { walletAddress } = useWallet();
  const [showUpload, setShowUpload] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true);
        setShowUpload(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (e.target === document.body || e.target === document.documentElement) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    <div className="App">
      <WaveBackground />
      
      {/* UserBar as Fixed Overlay */}
      {walletAddress && (
        <div className="userbar-overlay-container">
          <UserBar />
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="main-container">
        {!walletAddress ? (
          <div className="welcome-screen">
            <h1 className="title">AI Image Processing</h1>
            <p className="description">
              AI Image Processing with Blockchain Layer Integration
            </p>
            <WalletConnect />
          </div>
        ) : (
          <div className="home-content">
            <div className="content-grid">
              <div className="content-section chatbot-section">
                <ChatBot />
              </div>
            </div>
            {showUpload && (
              <>
                <div className="overlay-backdrop" onClick={() => setShowUpload(false)} />
                <div className={`upload-overlay ${isDragging ? 'dragging' : ''}`}>
                  <button 
                    className="close-upload-btn" 
                    onClick={() => setShowUpload(false)}
                    aria-label="Close upload"
                  >
                    ✕
                  </button>
                  <ImageUpload />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;