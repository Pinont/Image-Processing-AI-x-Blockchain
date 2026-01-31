import React, { useState, useEffect } from 'react';
import WaveBackground from './components/WaveBackground';
import UserBar from './components/UserBar';
import WalletConnect from './components/WalletConnect';
import ImageUpload from './components/ImageUpload';
import ChatBot from './components/ChatBot';
import TokenPurchase from './components/TokenPurchase';
import LandingPage from './components/LandingPage';
import useWallet from './hooks/useWallet';
import EventManager, { EVENTS } from './managers/EventManager';
import './styles/index.css';

type Page = 'landing' | 'home' | 'token-purchase';

const App: React.FC = () => {
  const { walletAddress } = useWallet();
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [showUpload, setShowUpload] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Redirect to landing if wallet disconnected and not on landing page
    if (!walletAddress && currentPage !== 'landing') {
      setCurrentPage('landing');
    }
  }, [walletAddress, currentPage]);

  // Listen for overlay close events
  useEffect(() => {
    const unsubscribe = EventManager.on(EVENTS.OVERLAY_CLOSE, () => {
      setShowUpload(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

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
      {currentPage === 'landing' ? (
        <LandingPage onGetStarted={() => setCurrentPage('home')} />
      ) : (
        <>
          <WaveBackground />
          
          {/* UserBar as Fixed Overlay */}
          {walletAddress && (
            <div className="userbar-overlay-container">
              <UserBar />
            </div>
          )}
          
          {/* Main Content Area */}
          <div className="main-container">
            {/* Navigation Bar */}
            <div className="navigation-bar">
              <button 
                className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`}
                onClick={() => setCurrentPage('home')}
              >
                <i className="bi bi-house-door-fill"></i> Home
              </button>
              <button 
                className={`nav-btn ${currentPage === 'token-purchase' ? 'active' : ''}`}
                onClick={() => setCurrentPage('token-purchase')}
              >
                <i className="bi bi-coin"></i> Get DEV3
              </button>
            </div>

                {/* Page Content */}
                {currentPage === 'home' ? (
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
                ) : (
                  <div className="page-content">
                    <TokenPurchase />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      );
    };
    
    export default App;