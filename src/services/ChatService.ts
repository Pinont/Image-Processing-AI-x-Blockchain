import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import StorageManager from '../managers/StorageManager';
import EventManager, { EVENTS } from '../managers/EventManager';
import { CHAT_CONFIG } from '../constants';

/**
 * ChatService - Service class for managing chats and messages
 */
export class ChatService {
  private static instance: ChatService;
  private chats: Map<string, Chat>;
  private storageManager: typeof StorageManager;
  private eventManager: typeof EventManager;
  private autoSaveTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.chats = new Map();
    this.storageManager = StorageManager;
    this.eventManager = EventManager;
    this.loadChats();
    this.startAutoSave();
  }

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * Create a new chat
   */
  public createChat(title: string = 'New Chat'): Chat {
    const chat = Chat.create(title);
    this.chats.set(chat.id, chat);
    this.saveChats();
    this.eventManager.emit(EVENTS.CHAT_CREATED, chat);
    return chat;
  }

  /**
   * Get a chat by ID
   */
  public getChat(chatId: string): Chat | undefined {
    return this.chats.get(chatId);
  }

  /**
   * Get all chats
   */
  public getAllChats(): Chat[] {
    return Array.from(this.chats.values());
  }

  /**
   * Delete a chat
   */
  public deleteChat(chatId: string): boolean {
    const deleted = this.chats.delete(chatId);
    if (deleted) {
      this.saveChats();
      this.eventManager.emit(EVENTS.CHAT_DELETED, chatId);
    }
    return deleted;
  }

  /**
   * Update chat title
   */
  public updateChatTitle(chatId: string, title: string): boolean {
    const chat = this.chats.get(chatId);
    if (chat) {
      chat.updateTitle(title);
      this.saveChats();
      return true;
    }
    return false;
  }

  /**
   * Add a message to a chat
   */
  public addMessage(chatId: string, message: Message): boolean {
    const chat = this.chats.get(chatId);
    if (chat) {
      chat.addMessage(message);
      this.saveChats();
      
      if (message.isUserMessage()) {
        this.eventManager.emit(EVENTS.CHAT_MESSAGE_SENT, message);
      } else {
        this.eventManager.emit(EVENTS.CHAT_MESSAGE_RECEIVED, message);
      }
      
      return true;
    }
    return false;
  }

  /**
   * Send a user message
   */
  public sendUserMessage(chatId: string, content: string, imageUrl?: string): Message | null {
    const message = Message.createUserMessage(content, imageUrl);
    const success = this.addMessage(chatId, message);
    return success ? message : null;
  }

  /**
   * Send a bot message
   */
  public sendBotMessage(chatId: string, content: string, processing?: boolean): Message | null {
    const message = Message.createBotMessage(content, processing);
    const success = this.addMessage(chatId, message);
    return success ? message : null;
  }

  /**
   * Update a message
   */
  public updateMessage(chatId: string, messageId: string, content: string): boolean {
    const chat = this.chats.get(chatId);
    if (chat) {
      const message = chat.getMessage(messageId);
      if (message) {
        message.updateContent(content);
        this.saveChats();
        return true;
      }
    }
    return false;
  }

  /**
   * Delete a message
   */
  public deleteMessage(chatId: string, messageId: string): boolean {
    const chat = this.chats.get(chatId);
    if (chat) {
      const deleted = chat.removeMessage(messageId);
      if (deleted) {
        this.saveChats();
      }
      return deleted;
    }
    return false;
  }

  /**
   * Clear all messages in a chat
   */
  public clearChat(chatId: string): boolean {
    const chat = this.chats.get(chatId);
    if (chat) {
      chat.clearMessages();
      this.saveChats();
      return true;
    }
    return false;
  }

  /**
   * Get chat history (all messages)
   */
  public getChatHistory(chatId: string): Message[] {
    const chat = this.chats.get(chatId);
    return chat ? chat.messages : [];
  }

  /**
   * Search messages across all chats
   */
  public searchMessages(query: string): Array<{ chat: Chat; messages: Message[] }> {
    const results: Array<{ chat: Chat; messages: Message[] }> = [];
    
    this.chats.forEach(chat => {
      const messages = chat.searchMessages(query);
      if (messages.length > 0) {
        results.push({ chat, messages });
      }
    });

    return results;
  }

  /**
   * Get chat count
   */
  public getChatCount(): number {
    return this.chats.size;
  }

  /**
   * Check if chat exists
   */
  public hasChat(chatId: string): boolean {
    return this.chats.has(chatId);
  }

  /**
   * Load chats from storage
   */
  private loadChats(): void {
    const storedChats = this.storageManager.loadChats();
    if (storedChats) {
      Object.entries(storedChats).forEach(([id, chatData]) => {
        this.chats.set(id, new Chat(chatData));
      });
    }

    // Create default chat if none exist
    if (this.chats.size === 0) {
      const defaultChat = this.createChat('New Chat');
      const welcomeMessage = Message.createBotMessage(
        'Hello! I\'m a YOLO object detection assistant. Upload an image and I\'ll tell you what objects I can detect!'
      );
      defaultChat.addMessage(welcomeMessage);
    }
  }

  /**
   * Save chats to storage
   */
  public saveChats(): void {
    const chatsObject: Record<string, any> = {};
    this.chats.forEach((chat, id) => {
      chatsObject[id] = chat.toJSON();
    });
    this.storageManager.saveChats(chatsObject);
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(() => {
      this.saveChats();
    }, CHAT_CONFIG.AUTO_SAVE_INTERVAL);
  }

  /**
   * Stop auto-save timer
   */
  public stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Export chat to JSON
   */
  public exportChat(chatId: string): string | null {
    const chat = this.chats.get(chatId);
    if (chat) {
      return JSON.stringify(chat.toJSON(), null, 2);
    }
    return null;
  }

  /**
   * Import chat from JSON
   */
  public importChat(jsonString: string): Chat | null {
    try {
      const chatData = JSON.parse(jsonString);
      const chat = new Chat(chatData);
      this.chats.set(chat.id, chat);
      this.saveChats();
      return chat;
    } catch (error) {
      console.error('Failed to import chat:', error);
      return null;
    }
  }

  /**
   * Clean up service
   */
  public cleanup(): void {
    this.stopAutoSave();
    this.saveChats();
  }
}

export default ChatService.getInstance();
