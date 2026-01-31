import { Chat as IChat } from '../types';
import { Message } from './Message';

/**
 * Chat Model Class with message management methods
 */
export class Chat implements IChat {
  public id: string;
  public title: string;
  public messages: Message[];
  public lastUpdate: Date;

  constructor(data: IChat) {
    this.id = data.id;
    this.title = data.title;
    this.messages = data.messages.map(msg => new Message(msg));
    this.lastUpdate = new Date(data.lastUpdate);
  }

  /**
   * Create a new chat
   */
  public static create(title: string = 'New Chat'): Chat {
    return new Chat({
      id: Chat.generateId(),
      title,
      messages: [],
      lastUpdate: new Date()
    });
  }

  /**
   * Generate unique chat ID
   */
  private static generateId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add a message to the chat
   */
  public addMessage(message: Message): void {
    this.messages.push(message);
    this.updateTimestamp();
  }

  /**
   * Remove a message by ID
   */
  public removeMessage(messageId: string): boolean {
    const index = this.messages.findIndex(msg => msg.id === messageId);
    if (index !== -1) {
      this.messages.splice(index, 1);
      this.updateTimestamp();
      return true;
    }
    return false;
  }

  /**
   * Get message by ID
   */
  public getMessage(messageId: string): Message | undefined {
    return this.messages.find(msg => msg.id === messageId);
  }

  /**
   * Get last message
   */
  public getLastMessage(): Message | undefined {
    return this.messages[this.messages.length - 1];
  }

  /**
   * Get message count
   */
  public getMessageCount(): number {
    return this.messages.length;
  }

  /**
   * Clear all messages
   */
  public clearMessages(): void {
    this.messages = [];
    this.updateTimestamp();
  }

  /**
   * Update chat title
   */
  public updateTitle(title: string): void {
    this.title = title;
    this.updateTimestamp();
  }

  /**
   * Update last update timestamp
   */
  private updateTimestamp(): void {
    this.lastUpdate = new Date();
  }

  /**
   * Get formatted last update time
   */
  public formatLastUpdate(): string {
    const now = new Date();
    const diff = now.getTime() - this.lastUpdate.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  /**
   * Get user messages only
   */
  public getUserMessages(): Message[] {
    return this.messages.filter(msg => msg.isUserMessage());
  }

  /**
   * Get bot messages only
   */
  public getBotMessages(): Message[] {
    return this.messages.filter(msg => msg.isBotMessage());
  }

  /**
   * Check if chat has messages
   */
  public hasMessages(): boolean {
    return this.messages.length > 0;
  }

  /**
   * Convert to plain object for serialization
   */
  public toJSON(): IChat {
    return {
      id: this.id,
      title: this.title,
      messages: this.messages.map(msg => msg.toJSON()),
      lastUpdate: this.lastUpdate
    };
  }

  /**
   * Validate chat data
   */
  public validate(): boolean {
    if (!this.id || !this.title) return false;
    if (!Array.isArray(this.messages)) return false;
    if (!(this.lastUpdate instanceof Date)) return false;
    return this.messages.every(msg => msg.validate());
  }

  /**
   * Create a copy of the chat
   */
  public clone(): Chat {
    return new Chat(this.toJSON());
  }

  /**
   * Get chat summary (first few words of last message)
   */
  public getSummary(maxLength: number = 50): string {
    const lastMessage = this.getLastMessage();
    if (!lastMessage) return 'No messages';
    
    const content = lastMessage.content;
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  /**
   * Search messages by content
   */
  public searchMessages(query: string): Message[] {
    const lowerQuery = query.toLowerCase();
    return this.messages.filter(msg => 
      msg.content.toLowerCase().includes(lowerQuery)
    );
  }
}
