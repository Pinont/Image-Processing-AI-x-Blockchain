import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../hooks/useUser';
import { usage_cost } from '../config';
import EventManager, { EVENTS } from '../managers/EventManager';
import './ChatBot.css';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  processing?: boolean;
}

interface Detection {
  class: string;
  confidence: number;
  box: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

interface DetectionResult {
  detections: Detection[];
  annotated_image: string; // Base64 image with boxes already drawn
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  lastUpdate: Date;
}

const ChatBot: React.FC = () => {
  // Using DEV3 for usage costs (configured in src/config.ts)
  const { dev3Balance, consumeDev3 } = useUser();
  const [currentChatId, setCurrentChatId] = useState<string>('default');
  const [chats, setChats] = useState<Map<string, Chat>>(new Map([
    ['default', {
      id: 'default',
      title: 'New Chat',
      messages: [{
        id: '1',
        type: 'bot',
        content: `Hello! I'm a YOLO object detection assistant. Upload an image and I'll tell you what objects I can detect! Message cost: ${usage_cost.prompt} DEV3; Image generation cost: ${usage_cost.generation} DEV3 (from config).`,
        timestamp: new Date(),
      }],
      lastUpdate: new Date(),
    }]
  ]));
  const [showChatList, setShowChatList] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentChat = chats.get(currentChatId);
  const messages = currentChat?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for image uploads from ImageUpload component
  useEffect(() => {
    const unsubscribe = EventManager.on(EVENTS.IMAGE_UPLOADED, async (file: File) => {
      if (file) {
        // Convert file to preview
        const reader = new FileReader();
        reader.onloadend = async () => {
          const preview = reader.result as string;
          
          // Usage costs (from config module)
          const imageCost = usage_cost.generation; // per image generation
          const totalCost = parseFloat(imageCost.toFixed(8));

          if (!consumeDev3(totalCost)) {
            addMessage('bot', `Sorry, you don't have enough DEV3. You need ${totalCost.toFixed(2)} DEV3 but only have ${dev3Balance.toFixed(2)} DEV3.`);
            return;
          }

          // Add user message with image
          const userContent = 'Please analyze this image';
          addMessage('user', userContent, preview);

          // Analyze the image immediately
          await simulateBotResponse(userContent, file, undefined);
        };
        reader.readAsDataURL(file);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [dev3Balance, consumeDev3]);

  // Draw detection boxes on canvas
  useEffect(() => {
    if (detectionResult && detectionResult.annotated_image) {
      console.log('Detection result received with annotated image');
    } else {
      console.log('No detection result or annotated image');
    }
  }, [detectionResult]);

  const updateCurrentChat = (updater: (chat: Chat) => Chat) => {
    setChats(prev => {
      const newChats = new Map(prev);
      const chat = newChats.get(currentChatId);
      if (chat) {
        newChats.set(currentChatId, updater(chat));
      }
      return newChats;
    });
  };

  const addMessage = (type: 'user' | 'bot', content: string, imageUrl?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      imageUrl,
    };
    updateCurrentChat(chat => ({
      ...chat,
      messages: [...chat.messages, newMessage],
      lastUpdate: new Date(),
    }));
  };

  const createNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat: Chat = {
      id: newChatId,
      title: 'New Chat',
      messages: [{
        id: '1',
        type: 'bot',
        content: 'Hello! I\'m a YOLO object detection assistant. Upload an image and I\'ll tell you what objects I can detect!',
        timestamp: new Date(),
      }],
      lastUpdate: new Date(),
    };
    
    setChats(prev => new Map(prev).set(newChatId, newChat));
    setCurrentChatId(newChatId);
    setShowChatList(false);
  };

  const switchChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setShowChatList(false);
  };

  const getImageBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const simulateBotResponse = async (userMessage: string, imageFile?: File, imageUrl?: string) => {
    // Add typing indicator
    const typingId = `typing-${Date.now()}`;
    const typingMessage: Message = {
      id: typingId,
      type: 'bot',
      content: '',
      timestamp: new Date(),
      processing: true,
    };
    
    updateCurrentChat(chat => ({
      ...chat,
      messages: [...chat.messages, typingMessage],
      lastUpdate: new Date(),
    }));

    try {
      let botResponse = '';
      let detections: Detection[] = [];

      if (imageFile) {
        // Convert image to base64
        const base64Image = await getImageBase64(imageFile);
        const base64Data = base64Image.split(',')[1]; // Remove data:image/xxx;base64, prefix

        console.log('Sending image to YOLO server for detection');

        // Call YOLO detection API
        const response = await fetch('http://localhost:8000/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            image: base64Data,
          }),
        });

        if (!response.ok) {
          throw new Error(`YOLO API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('YOLO Response:', data); // Debug log
        botResponse = data.response || 'Sorry, I could not analyze the image.';
        detections = data.detections || [];
        const annotatedImage = data.annotated_image;
        
        console.log('Detections:', detections); // Debug log
        console.log('Annotated image received:', !!annotatedImage); // Debug log
        
        // Set detection result for visualization (with YOLO's annotated image)
        if (annotatedImage) {
          setDetectionResult({
            detections,
            annotated_image: annotatedImage
          });
        }
      } else {
        // Text-only chat
        const response = await fetch('http://localhost:8000/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
          }),
        });

        if (!response.ok) {
          throw new Error(`YOLO API error: ${response.status}`);
        }

        const data = await response.json();
        botResponse = data.response || 'Sorry, I could not generate a response.';
      }

      // Remove typing indicator
      updateCurrentChat(chat => ({
        ...chat,
        messages: chat.messages.filter(m => m.id !== typingId),
      }));

      addMessage('bot', botResponse);
    } catch (error: any) {
      console.error('Error calling YOLO server:', error);
      
      // Remove typing indicator on error
      updateCurrentChat(chat => ({
        ...chat,
        messages: chat.messages.filter(m => m.id !== typingId),
      }));
      
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        addMessage('bot', 'Connection error: Please make sure the YOLO server is running. Run "python yolo-server.py" in a separate terminal.');
      } else {
        addMessage('bot', `Sorry, I am unable to connect to the AI model. Error: ${error.message || 'Please make sure the YOLO server is running on port 8000'}`);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;

    // Usage costs (from config module)
    const messageCost = usage_cost.prompt; // per text message
    const imageCost = selectedImage ? usage_cost.generation : 0; // per image generation
    const totalCost = parseFloat((messageCost + imageCost).toFixed(8));

    if (!consumeDev3(totalCost)) {
      addMessage('bot', `Sorry, you don't have enough DEV3. You need ${totalCost.toFixed(2)} DEV3 but only have ${dev3Balance.toFixed(2)} DEV3.`);
      return;
    }

    // Add user message
    const userContent = inputText.trim() || 'Please analyze this image';
    let imageUrl: string | undefined;
    const imageToAnalyze = selectedImage;

    if (selectedImage) {
      // Show image preview in chat (not uploaded)
      addMessage('user', userContent, imagePreview || undefined);
    } else {
      addMessage('user', userContent);
    }

    // Clear inputs
    const currentImageFile = imageToAnalyze || undefined;
    setInputText('');
    setSelectedImage(null);
    setImagePreview(null);
    // Reset file input to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Get bot response with image analysis if applicable
    await simulateBotResponse(userContent, currentImageFile, imageUrl);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="chatbot-container">
      {/* Chat Management Header */}
      <div className="chat-header">
        <button className="chat-list-btn" onClick={() => setShowChatList(!showChatList)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h3 className="chat-title">{currentChat?.title || 'Chat'}</h3>
        <button className="new-chat-btn" onClick={createNewChat}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Chat List Sidebar */}
      {showChatList && (
        <div className="chat-list-overlay" onClick={() => setShowChatList(false)}>
          <div className="chat-list-sidebar" onClick={(e) => e.stopPropagation()}>
            <h3>Your Chats</h3>
            <div className="chat-list">
              {Array.from(chats.values()).map(chat => (
                <div 
                  key={chat.id} 
                  className={`chat-list-item ${chat.id === currentChatId ? 'active' : ''}`}
                  onClick={() => switchChat(chat.id)}
                >
                  <div className="chat-list-title">{chat.title}</div>
                  <div className="chat-list-time">
                    {chat.lastUpdate.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="chat-content-wrapper">
        <div className="chat-window">
        {/* Messages */}
        <div className="messages-container">{messages.map((message) => (
            <div key={message.id} className={`message ${message.type}-message`}>
              <div className="message-avatar">
                {message.type === 'bot' ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                )}
              </div>
              <div className="message-content">
                {message.imageUrl && (
                  <div className="message-image">
                    <img src={message.imageUrl} alt="Uploaded" />
                  </div>
                )}
                {message.processing ? (
                  <div className="message-text typing-bubble typing-indicator">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="message-text">{message.content}</div>
                    <div className="message-time">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="message bot-message">
              <div className="message-avatar">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
              <div className="message-content">
                <div className="message-text typing-bubble">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-input-area">
          {imagePreview && (
            <div className="image-preview-container">
              <div className="image-preview-wrapper">
                <img src={imagePreview} alt="Preview" />
                <button onClick={removeSelectedImage} className="remove-image-btn">
                  ×
                </button>
              </div>
              <span className="image-preview-name">{selectedImage?.name}</span>
            </div>
          )}
          
          <div className="input-controls">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="file-input-hidden"
              id="chat-file-input"
            />
            <label htmlFor="chat-file-input" className="attach-btn" title="Attach image ($0.02)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </label>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Type your message... (~$${usage_cost.prompt} per message)`}
              className="chat-input"
              rows={1}
              disabled={isProcessing}
            />
            
            <button
              onClick={handleSendMessage}
              disabled={(!inputText.trim() && !selectedImage) || isProcessing}
              className="send-btn"
              title="Send message"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          <div className="token-cost-info">
            <span><i className="bi bi-chat-dots-fill"></i> Message: {usage_cost.prompt} DEV3</span>
            <span><i className="bi bi-image-fill"></i> Image: {usage_cost.generation} DEV3</span>
            <span className="token-balance"><i className="bi bi-wallet2"></i> Balance: {dev3Balance.toFixed(2)} DEV3</span>
          </div>
        </div>
      </div>

      {/* Detection Visualization Panel */}
      {detectionResult && (
        <div className="detection-panel">
          <div className="detection-header">
            <h3><i className="bi bi-crosshair"></i> Object Detection</h3>
            <button 
              className="close-detection-btn"
              onClick={() => setDetectionResult(null)}
              title="Close detection panel"
            >
              ×
            </button>
          </div>
          <div className="detection-canvas-wrapper">
            {detectionResult.annotated_image ? (
              <img 
                src={detectionResult.annotated_image} 
                alt="Detected objects" 
                className="detection-canvas"
              />
            ) : (
              <p style={{color: 'white', textAlign: 'center'}}>No image to display</p>
            )}
          </div>
          <div className="detection-list">
            <h4>Detected Objects:</h4>
            {detectionResult.detections.map((detection, index) => (
              <div key={index} className="detection-item">
                <span className="detection-class">{detection.class}</span>
                <span className="detection-confidence">
                  {(detection.confidence * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default ChatBot;
