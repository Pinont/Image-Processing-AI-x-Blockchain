import { StorageData, User, Chat } from '../types';
import { STORAGE_KEYS, DEFAULT_USER } from '../constants';

/**
 * StorageManager - Singleton class for managing localStorage operations
 */
export class StorageManager {
  private static instance: StorageManager;

  private constructor() {}

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * Save data to localStorage with serialization
   */
  public save<T>(key: string, data: T): boolean {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`Failed to save to localStorage (${key}):`, error);
      return false;
    }
  }

  /**
   * Load data from localStorage with deserialization
   */
  public load<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        return defaultValue ?? null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Failed to load from localStorage (${key}):`, error);
      return defaultValue ?? null;
    }
  }

  /**
   * Remove item from localStorage
   */
  public remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove from localStorage (${key}):`, error);
      return false;
    }
  }

  /**
   * Clear all localStorage data
   */
  public clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }

  /**
   * Check if key exists in localStorage
   */
  public has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Get all keys from localStorage
   */
  public getAllKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Save user data
   */
  public saveUser(user: User): boolean {
    return this.save(STORAGE_KEYS.USER_DATA, user);
  }

  /**
   * Load user data with default fallback
   */
  public loadUser(): User {
    return this.load<User>(STORAGE_KEYS.USER_DATA, DEFAULT_USER) ?? DEFAULT_USER;
  }

  /**
   * Save chat history
   */
  public saveChats(chats: Record<string, Chat>): boolean {
    return this.save(STORAGE_KEYS.CHAT_HISTORY, chats);
  }

  /**
   * Load chat history
   */
  public loadChats(): Record<string, Chat> | null {
    return this.load<Record<string, Chat>>(STORAGE_KEYS.CHAT_HISTORY);
  }

  /**
   * Save wallet address
   */
  public saveWalletAddress(address: string): boolean {
    return this.save(STORAGE_KEYS.WALLET_ADDRESS, address);
  }

  /**
   * Load wallet address
   */
  public loadWalletAddress(): string | null {
    return this.load<string>(STORAGE_KEYS.WALLET_ADDRESS);
  }

  /**
   * Get storage size estimate in bytes
   */
  public getStorageSize(): number {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          total += key.length + value.length;
        }
      }
    }
    return total;
  }

  /**
   * Migrate old storage format to new format (if needed)
   */
  public migrate(): boolean {
    try {
      // Add migration logic here if storage format changes
      console.log('Storage migration completed');
      return true;
    } catch (error) {
      console.error('Storage migration failed:', error);
      return false;
    }
  }
}

export default StorageManager.getInstance();
