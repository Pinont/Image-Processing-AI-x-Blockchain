import React, { useEffect, useState } from 'react';
import useWallet from '../hooks/useWallet';
import WaveBackground from './WaveBackground';
import './LandingPage.css';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const { walletAddress, connectWallet } = useWallet();
  const [scrollY, setScrollY] = useState(0);
  const [winkGetStart, setWinkGetStart] = useState(false);

  // Auto-navigate when wallet connects
  useEffect(() => {
    if (walletAddress) {
      // Give user a moment to see connection success, then redirect
      const timer = setTimeout(() => {
        onGetStarted();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [walletAddress, onGetStarted]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTryDetection = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Trigger wink effect after scroll
    setTimeout(() => {
      setWinkGetStart(true);
      setTimeout(() => setWinkGetStart(false), 2000);
    }, 500);
  };

  const handleGetStart = async () => {
    if (!walletAddress) {
      await connectWallet();
    } else {
      onGetStarted();
    }
  };

  return (
    <div className="landing-page">
      <WaveBackground />
      
      {/* Hero Section */}
      <section className="hero-section" id="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <i className="bi bi-shield-check"></i>
            <span>Powered by Web3 & AI</span>
          </div>
          
          <h1 className="hero-title">
            The Future of
            <span className="gradient-text"> AI-Powered </span>
            Web3 Detection
          </h1>
          
          <p className="hero-description">
            Experience cutting-edge YOLO object detection combined with blockchain technology. 
            Purchase DEV3 tokens with ETH and unlock powerful AI capabilities in a decentralized ecosystem.
          </p>

          <div className="hero-actions">
            <button 
              className={`cta-button primary ${!walletAddress || winkGetStart ? 'wink-effect' : ''}`} 
              onClick={handleGetStart}
            >
              <i className="bi bi-rocket-takeoff-fill"></i>
              Get Start
            </button>
            
            <button className="cta-button secondary" onClick={() => scrollToSection('features')}>
              <span>Learn More</span>
              <i className="bi bi-arrow-down"></i>
            </button>
          </div>

          <div className="hero-stats">
            <div className="hero-stat-item">
              <div className="hero-stat-value">1000+</div>
              <div className="hero-stat-label">Objects Detected</div>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat-item">
              <div className="hero-stat-value">Fast</div>
              <div className="hero-stat-label">Real-time Processing</div>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat-item">
              <div className="hero-stat-value">Secure</div>
              <div className="hero-stat-label">Blockchain Verified</div>
            </div>
          </div>
        </div>

        <div className="scroll-indicator" onClick={() => scrollToSection('features')}>
          <i className="bi bi-chevron-down"></i>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-header">
          <h2 className="section-title">Our Ecosystem</h2>
          <p className="section-subtitle">
            Two powerful components working together
          </p>
        </div>

        <div className="features-grid">
          {/* DEV3 Token Card */}
          <div className="feature-card token-card">
            <div className="card-icon">
              <i className="bi bi-coin"></i>
            </div>
            <h3 className="card-title">DEV3 Token</h3>
            <p className="card-description">
              Our native cryptocurrency that powers the entire platform. Purchase DEV3 with ETH 
              at a rate of 1 DEV3 = 0.001 ETH. Use tokens to access AI detection services, 
              chat with our intelligent bot, and unlock premium features.
            </p>
            <ul className="card-features">
              <li>
                <i className="bi bi-check-circle-fill"></i>
                <span>Instant ETH to DEV3 conversion</span>
              </li>
              <li>
                <i className="bi bi-check-circle-fill"></i>
                <span>Secure blockchain transactions</span>
              </li>
              <li>
                <i className="bi bi-check-circle-fill"></i>
                <span>Transparent pricing model</span>
              </li>
              <li>
                <i className="bi bi-check-circle-fill"></i>
                <span>Special coupon codes available</span>
              </li>
            </ul>
            <button className="card-button" onClick={() => window.location.href = '#/tokens'}>
              <span>Get DEV3 Tokens</span>
              <i className="bi bi-arrow-right"></i>
            </button>
          </div>

          {/* AI Detection Card */}
          <div className="feature-card ai-card">
            <div className="card-icon">
              <i className="bi bi-robot"></i>
            </div>
            <h3 className="card-title">Image Detection AI</h3>
            <p className="card-description">
              State-of-the-art YOLO (You Only Look Once) object detection powered by 
              advanced neural networks. Upload any image and get instant, accurate detection 
              of objects with bounding boxes and confidence scores.
            </p>
            <ul className="card-features">
              <li>
                <i className="bi bi-check-circle-fill"></i>
                <span>Real-time object detection</span>
              </li>
              <li>
                <i className="bi bi-check-circle-fill"></i>
                <span>80+ object categories</span>
              </li>
              <li>
                <i className="bi bi-check-circle-fill"></i>
                <span>High accuracy predictions</span>
              </li>
              <li>
                <i className="bi bi-check-circle-fill"></i>
                <span>Chat-based interaction</span>
              </li>
            </ul>
            <button className="card-button" onClick={() => scrollToSection('detection')}>
              <span>Explore AI</span>
              <i className="bi bi-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>

      {/* Detection Feature Section */}
      <section className="detection-section" id="detection">
        <div className="detection-content">
          <div className="detection-info">
            <div className="info-badge">
              <i className="bi bi-lightning-charge-fill"></i>
              <span>Powered by YOLO</span>
            </div>
            
            <h2 className="detection-title">
              Advanced Image Detection
            </h2>
            
            <p className="detection-description">
              Our AI-powered detection system uses the latest YOLO architecture to identify 
              and locate objects in images with remarkable speed and accuracy. Simply upload 
              an image through our chat interface, and watch as our AI analyzes and annotates 
              it in real-time.
            </p>

            <div className="detection-features">
              <div className="detection-feature">
                <div className="detection-feature-icon">
                  <i className="bi bi-eye-fill"></i>
                </div>
                <div className="detection-feature-content">
                  <h4>Multi-Object Recognition</h4>
                  <p>Detect and classify multiple objects simultaneously in a single image</p>
                </div>
              </div>

              <div className="detection-feature">
                <div className="detection-feature-icon">
                  <i className="bi bi-bullseye"></i>
                </div>
                <div className="detection-feature-content">
                  <h4>Precise Localization</h4>
                  <p>Get accurate bounding boxes with confidence scores for each detection</p>
                </div>
              </div>

              <div className="detection-feature">
                <div className="detection-feature-icon">
                  <i className="bi bi-speedometer2"></i>
                </div>
                <div className="detection-feature-content">
                  <h4>Lightning Fast</h4>
                  <p>Process images in milliseconds with our optimized detection pipeline</p>
                </div>
              </div>

              <div className="detection-feature">
                <div className="detection-feature-icon">
                  <i className="bi bi-chat-square-dots-fill"></i>
                </div>
                <div className="detection-feature-content">
                  <h4>Interactive Chat</h4>
                  <p>Ask questions about detected objects and get intelligent responses</p>
                </div>
              </div>
            </div>

            <button className="detection-cta" onClick={handleTryDetection}>
              <span>Try Detection Now</span>
              <i className="bi bi-arrow-right-circle-fill"></i>
            </button>
          </div>

          <div className="detection-visual">
            <div className="visual-card">
              <div className="visual-header">
                <i className="bi bi-image-fill"></i>
                <span>Upload Image</span>
              </div>
              <div className="visual-body">
                <div className="demo-image">
                  <i className="bi bi-cloud-arrow-up-fill"></i>
                  <p>Drop an image to detect objects</p>
                </div>
                <div className="detection-boxes">
                  <div className="detection-box box-1">
                    <span className="box-label">Person 95%</span>
                  </div>
                  <div className="detection-box box-2">
                    <span className="box-label">Car 92%</span>
                  </div>
                  <div className="detection-box box-3">
                    <span className="box-label">Dog 88%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" id="footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-brand">
              <i className="bi bi-hexagon-fill"></i>
              <span>DEV3 AI</span>
            </div>
            <p className="footer-tagline">
              Bridging AI and Blockchain for the future of intelligent applications
            </p>
            <div className="footer-social">
              <a href="#" className="social-link">
                <i className="bi bi-twitter"></i>
              </a>
              <a href="#" className="social-link">
                <i className="bi bi-github"></i>
              </a>
              <a href="#" className="social-link">
                <i className="bi bi-discord"></i>
              </a>
              <a href="#" className="social-link">
                <i className="bi bi-telegram"></i>
              </a>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>Platform</h4>
              <a href="#">Get Started</a>
              <a href="#/tokens">Get DEV3</a>
              <a href="#">AI Detection</a>
              <a href="#">Documentation</a>
            </div>

            <div className="footer-column">
              <h4>Resources</h4>
              <a href="#">Whitepaper</a>
              <a href="#">API Docs</a>
              <a href="#">Tutorials</a>
              <a href="#">Blog</a>
            </div>

            <div className="footer-column">
              <h4>Community</h4>
              <a href="#">Discord</a>
              <a href="#">Telegram</a>
              <a href="#">Twitter</a>
              <a href="#">GitHub</a>
            </div>

            <div className="footer-column">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
              <a href="#">License</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 DEV3 AI. All rights reserved.</p>
          <div className="footer-badges">
            <span className="badge">
              <i className="bi bi-shield-check"></i>
              Secure
            </span>
            <span className="badge">
              <i className="bi bi-lightning-fill"></i>
              Fast
            </span>
            <span className="badge">
              <i className="bi bi-lock-fill"></i>
              Decentralized
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
