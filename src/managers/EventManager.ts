/**
 * EventManager - Singleton class for managing global events and event coordination
 */

type EventCallback = (...args: any[]) => void;
type EventUnsubscribe = () => void;

export class EventManager {
  private static instance: EventManager;
  private listeners: Map<string, Set<EventCallback>>;

  private constructor() {
    this.listeners = new Map();
  }

  public static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  /**
   * Subscribe to an event
   */
  public on(event: string, callback: EventCallback): EventUnsubscribe {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const callbacks = this.listeners.get(event)!;
    callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * Subscribe to an event only once
   */
  public once(event: string, callback: EventCallback): EventUnsubscribe {
    const wrapper: EventCallback = (...args: any[]) => {
      callback(...args);
      unsubscribe();
    };

    const unsubscribe = this.on(event, wrapper);
    return unsubscribe;
  }

  /**
   * Emit an event
   */
  public emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event callback for "${event}":`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event
   */
  public off(event: string): void {
    this.listeners.delete(event);
  }

  /**
   * Remove all event listeners
   */
  public clear(): void {
    this.listeners.clear();
  }

  /**
   * Get listener count for an event
   */
  public listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  /**
   * Get all event names
   */
  public getEventNames(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Check if event has listeners
   */
  public hasListeners(event: string): boolean {
    return this.listenerCount(event) > 0;
  }
}

// Predefined event constants
export const EVENTS = {
  // User events
  USER_BALANCE_CHANGED: 'user:balance:changed',
  USER_TRANSACTION: 'user:transaction',

  // Wallet events
  WALLET_CONNECTED: 'wallet:connected',
  WALLET_DISCONNECTED: 'wallet:disconnected',
  WALLET_ERROR: 'wallet:error',

  // Chat events
  CHAT_MESSAGE_SENT: 'chat:message:sent',
  CHAT_MESSAGE_RECEIVED: 'chat:message:received',
  CHAT_CREATED: 'chat:created',
  CHAT_DELETED: 'chat:deleted',

  // Detection events
  DETECTION_STARTED: 'detection:started',
  DETECTION_COMPLETED: 'detection:completed',
  DETECTION_FAILED: 'detection:failed',

  // Upload events
  UPLOAD_STARTED: 'upload:started',
  UPLOAD_PROGRESS: 'upload:progress',
  UPLOAD_COMPLETED: 'upload:completed',
  UPLOAD_FAILED: 'upload:failed',
  IMAGE_UPLOADED: 'image:uploaded',

  // Drag and drop events
  DRAG_ENTER: 'drag:enter',
  DRAG_LEAVE: 'drag:leave',
  DRAG_DROP: 'drag:drop',

  // UI events
  OVERLAY_OPEN: 'overlay:open',
  OVERLAY_CLOSE: 'overlay:close',
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',

  // Token events
  TOKEN_PURCHASED: 'token:purchased',
  TOKEN_BALANCE_UPDATED: 'token:balance:updated'
} as const;

export default EventManager.getInstance();
