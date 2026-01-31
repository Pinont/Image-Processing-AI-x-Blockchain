import React, { useState, useRef, useEffect } from 'react';
import ChatService from '../services/ChatService';
import YOLODetectionService from '../services/YOLODetectionService';
import ImageUploadService from '../services/ImageUploadService';
import UserBalanceService from '../services/UserBalanceService';
import ConfigManager from '../managers/ConfigManager';
import EventManager, { EVENTS } from '../managers/EventManager';
import { Message } from '../models/Message';
import { Chat } from '../models/Chat';
import { DetectionResultModel } from '../models/Detection';
import { ImageFile } from '../models/ImageFile';
import { TransactionType } from '../types';
import './ChatBot.css';

const ChatBot: React.FC = () => {
  // Services
  const chatService = ChatService;
  const detectionService = YOLODetectionService;
  const uploadService = ImageUploadService;
  const balanceService = UserBalanceService;
  const configManager = ConfigManager;

  // State
  const [currentChatId, setCurrentChatId] = useState<string>('default');
  const [chats, setChats] = useState<Chat[]>([]);
  const [showChatList, setShowChatList] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResultModel | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current chat
  const currentChat = chats.find(chat => chat.id === currentChatId);
  const messages = currentChat?.messages || [];

  // Initialize
  useEffect(() => {
    loadChats();
    setupEventListeners();
    
    return () => {
      cleanup();
    };
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = () => {
    const allChats = chatService.getAllChats();
    setChats(allChats);
    
    // Create default chat if none exist
    if (allChats.length === 0) {
      const defaultChat = chatService.createChat('New Chat');
      setCurrentChatId(defaultChat.id);
      setChats([defaultChat]);
    } else if (!currentChatId) {
      setCurrentChatId(allChats[0].id);
    }
  };

  const setupEventListeners = () => {
    const unsubscribers = [
      EventManager.on(EVENTS.CHAT_MESSAGE_SENT, () => loadChats()),
      EventManager.on(EVENTS.CHAT_MESSAGE_RECEIVED, () => loadChats()),
      EventManager.on(EVENTS.CHAT_CREATED, () => loadChats()),
      EventManager.on(EVENTS.CHAT_DELETED, () => loadChats())
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  };

  const cleanup = () => {
    chatService.stopAutoSave();
  };

  const createNewChat = () => {
    const newChat = chatService.createChat('New Chat');
    setCurrentChatId(newChat.id);
    setChats(chatService.getAllChats());
    setShowChatList(false);
  };

  const switchChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setShowChatList(false);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;

    // Check balance
    const transactionType = selectedImage ? TransactionType.GENERATION : TransactionType.PROMPT;
    const canAfford = balanceService.canAffordTransaction(transactionType);

    if (!canAfford) {
      const cost = selectedImage ? configManager.getGenerationCost() : configManager.getPromptCost();
      const botMessage = Message.createBotMessage(
        `Sorry, you don't have enough balance. You need $${cost} but only have $${balanceService.getCoinBalance()}.`
      );
      chatService.addMessage(currentChatId, botMessage);
      loadChats();
      return;
    }

    // Process transaction
    const transaction = balanceService.processTransaction(transactionType);
    if (!transaction.success) {
      const botMessage = Message.createBotMessage(transaction.error || 'Transaction failed');
      chatService.addMessage(currentChatId, botMessage);
      loadChats();
      return;
    }

    // Add user message
    const userContent = inputText.trim() || 'Please analyze this image';
    const userMessage = Message.createUserMessage(
      userContent,
      selectedImage?.preview
    );
    chatService.addMessage(currentChatId, userMessage);

    // Clear inputs
    const imageToAnalyze = selectedImage;
    setInputText('');
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Get bot response
    await processUserMessage(userContent, imageToAnalyze);
    loadChats();
  };

  const processUserMessage = async (content: string, imageFile: ImageFile | null) => {
    setIsProcessing(true);

    // Add processing message
    const processingMessage = Message.createBotMessage('Analyzing...', true);
    chatService.addMessage(currentChatId, processingMessage);
    loadChats();

    try {
      let responseContent = '';

      if (imageFile) {
        // Detect objects in image
        const result = await detectionService.detectObjects(imageFile);
        setDetectionResult(result);

        // Create response based on detections
        if (result.hasDetections()) {
          const summary = result.getSummary();
          const detectionList = result.getFormattedList().slice(0, 10).join(', ');
          responseContent = `${summary}. Detected: ${detectionList}`;
        } else {
          responseContent = 'No objects detected in the image.';
        }
      } else {
        // Text-only response
        responseContent = 'I can help you analyze images! Please upload an image to detect objects.';
      }

      // Remove processing message and add actual response
      chatService.deleteMessage(currentChatId, processingMessage.id);
      const botMessage = Message.createBotMessage(responseContent);
      chatService.addMessage(currentChatId, botMessage);
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Remove processing message
      chatService.deleteMessage(currentChatId, processingMessage.id);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to process message';
      const botMessage = Message.createBotMessage(
        `Sorry, I encountered an error: ${errorMessage}. Please make sure the YOLO server is running.`
      );
      chatService.addMessage(currentChatId, botMessage);
    } finally {
      setIsProcessing(false);
      loadChats();
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imageFile = await uploadService.uploadImage(file);
      setSelectedImage(imageFile);
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      alert(errorMessage);
    }
  };

  const handleRemoveImage = () => {
    if (selectedImage) {
      uploadService.cleanup(selectedImage);
    }
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const closeDetectionPanel = () => {
    setDetectionResult(null);
  };

  return (
    <div className="chatbot-container">
      {/* Header */}
      <div className="chat-header">
        <button className="chat-list-toggle" onClick={() => setShowChatList(!showChatList)}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h2>{currentChat?.title || 'Chat'}</h2>
        <button className="new-chat-btn btn-glass" onClick={createNewChat}>
          New Chat
        </button>
      </div>

      {/* Chat List Sidebar */}
      {showChatList && (
        <div className="chat-sidebar">
          <h3>Chats</h3>
          <div className="chat-list custom-scrollbar">
            {chats.map(chat => (
              <div
                key={chat.id}
                className={`chat-item ${chat.id === currentChatId ? 'active' : ''}`}
                onClick={() => switchChat(chat.id)}
              >
                <div className="chat-item-title">{chat.title}</div>
                <div className="chat-item-time">{chat.formatLastUpdate()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="chat-content-wrapper">
        {/* Chat Window */}
        <div className="chat-window">
          <div className="messages-container custom-scrollbar">
            {messages.map(message => (
              <div
                key={message.id}
                className={`message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
              >
                {message.hasImage() && (
                  <div className="message-image-container">
                    <img src={message.imageUrl} alt="Uploaded" className="message-image" />
                  </div>
                )}
                <div className="message-content">
                  {message.isProcessing() ? (
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
                <div className="message-time">{message.formatTimestamp()}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="input-container">
            {selectedImage && (
              <div className="selected-image-preview">
                <img src={selectedImage.preview} alt="Preview" />
                <button className="remove-image-btn" onClick={handleRemoveImage}>
                  ×
                </button>
                <span className="image-name">{selectedImage.getName()}</span>
              </div>
            )}

            <div className="input-wrapper">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="file-input-hidden"
              />
              <button
                className="attach-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="message-input"
                disabled={isProcessing}
              />

              <button
                className="send-btn btn-glass"
                onClick={handleSendMessage}
                disabled={isProcessing || (!inputText.trim() && !selectedImage)}
              >
                {isProcessing ? (
                  <div className="spinner" />
                ) : (
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Detection Panel */}
        {detectionResult && (
          <div className="detection-panel">
            <div className="detection-header">
              <h3>Detection Results</h3>
              <button className="close-detection-btn" onClick={closeDetectionPanel}>
                ×
              </button>
            </div>

            <div className="detection-canvas-wrapper">
              <img
                src={`data:image/jpeg;base64,${detectionResult.annotated_image}`}
                alt="Detection result"
                className="detection-canvas"
              />
            </div>

            <div className="detection-list custom-scrollbar">
              <h4>Detected Objects ({detectionResult.getDetectionCount()})</h4>
              {detectionResult.sortByConfidence().map((detection, index) => (
                <div key={index} className="detection-item">
                  <span className="detection-class">{detection.class}</span>
                  <span className={`detection-confidence confidence-${detection.getConfidenceLevel()}`}>
                    {detection.getConfidencePercent()}
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
