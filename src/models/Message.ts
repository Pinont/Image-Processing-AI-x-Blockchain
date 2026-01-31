import { Message as IMessage } from '../types';

/**
 * Message Model Class with validation and formatting methods
 */
export class Message implements IMessage {
  public id: string;
  public type: 'user' | 'bot';
  public content: string;
  public timestamp: Date;
  public imageUrl?: string;
  public processing?: boolean;

  constructor(data: IMessage) {
    this.id = data.id;
    this.type = data.type;
    this.content = data.content;
    this.timestamp = new Date(data.timestamp);
    this.imageUrl = data.imageUrl;
    this.processing = data.processing;
  }

  /**
   * Create a new user message
   */
  public static createUserMessage(content: string, imageUrl?: string): Message {
    return new Message({
      id: Message.generateId(),
      type: 'user',
      content,
      timestamp: new Date(),
      imageUrl
    });
  }

  /**
   * Create a new bot message
   */
  public static createBotMessage(content: string, processing?: boolean): Message {
    return new Message({
      id: Message.generateId(),
      type: 'bot',
      content,
      timestamp: new Date(),
      processing
    });
  }

  /**
   * Generate unique message ID
   */
  private static generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format timestamp for display
   */
  public formatTimestamp(): string {
    const now = new Date();
    const diff = now.getTime() - this.timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (seconds > 0) return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  /**
   * Check if message is from user
   */
  public isUserMessage(): boolean {
    return this.type === 'user';
  }

  /**
   * Check if message is from bot
   */
  public isBotMessage(): boolean {
    return this.type === 'bot';
  }

  /**
   * Check if message has an image
   */
  public hasImage(): boolean {
    return !!this.imageUrl;
  }

  /**
   * Check if message is still processing
   */
  public isProcessing(): boolean {
    return !!this.processing;
  }

  /**
   * Convert to plain object for serialization
   */
  public toJSON(): IMessage {
    return {
      id: this.id,
      type: this.type,
      content: this.content,
      timestamp: this.timestamp,
      imageUrl: this.imageUrl,
      processing: this.processing
    };
  }

  /**
   * Validate message data
   */
  public validate(): boolean {
    if (!this.id || !this.type || !this.content) return false;
    if (this.type !== 'user' && this.type !== 'bot') return false;
    if (!(this.timestamp instanceof Date)) return false;
    return true;
  }

  /**
   * Create a copy of the message
   */
  public clone(): Message {
    return new Message(this.toJSON());
  }

  /**
   * Update message content
   */
  public updateContent(content: string): void {
    this.content = content;
  }

  /**
   * Mark as processing
   */
  public markAsProcessing(): void {
    this.processing = true;
  }

  /**
   * Mark as completed
   */
  public markAsCompleted(): void {
    this.processing = false;
  }
}
