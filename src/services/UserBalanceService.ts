import { User, TransactionType } from '../types';
import StorageManager from '../managers/StorageManager';
import EventManager, { EVENTS } from '../managers/EventManager';
import ConfigManager from '../managers/ConfigManager';
import { ERROR_MESSAGES } from '../constants';

/**
 * UserBalanceService - Service class for managing user token and coin balances
 */
export class UserBalanceService {
  private static instance: UserBalanceService;
  private user: User;
  private storageManager: typeof StorageManager;
  private eventManager: typeof EventManager;
  private configManager: typeof ConfigManager;

  private constructor() {
    this.storageManager = StorageManager;
    this.eventManager = EventManager;
    this.configManager = ConfigManager;
    this.user = this.loadUser();
  }

  public static getInstance(): UserBalanceService {
    if (!UserBalanceService.instance) {
      UserBalanceService.instance = new UserBalanceService();
    }
    return UserBalanceService.instance;
  }

  /**
   * Get current user
   */
  public getUser(): User {
    return { ...this.user };
  }

  /**
   * Get token balance
   */
  public getTokenBalance(): number {
    return this.user.tokenBalance;
  }

  /**
   * Get coin balance
   */
  public getCoinBalance(): number {
    return this.user.coinBalance;
  }

  /**
   * Add tokens to balance
   */
  public addTokens(amount: number): boolean {
    if (amount <= 0) return false;
    
    this.user.tokenBalance += amount;
    this.saveUser();
    this.eventManager.emit(EVENTS.USER_BALANCE_CHANGED, this.user);
    return true;
  }

  /**
   * Add coins to balance
   */
  public addCoins(amount: number): boolean {
    if (amount <= 0) return false;
    
    this.user.coinBalance += amount;
    this.saveUser();
    this.eventManager.emit(EVENTS.USER_BALANCE_CHANGED, this.user);
    return true;
  }

  /**
   * Consume tokens from balance
   */
  public consumeTokens(amount: number): boolean {
    if (amount <= 0) return false;
    if (this.user.tokenBalance < amount) {
      return false;
    }
    
    this.user.tokenBalance -= amount;
    this.saveUser();
    this.eventManager.emit(EVENTS.USER_BALANCE_CHANGED, this.user);
    this.eventManager.emit(EVENTS.USER_TRANSACTION, {
      type: 'token',
      amount: -amount,
      balance: this.user.tokenBalance
    });
    return true;
  }

  /**
   * Consume coins from balance
   */
  public consumeCoins(amount: number): boolean {
    if (amount <= 0) return false;
    if (this.user.coinBalance < amount) {
      return false;
    }
    
    this.user.coinBalance -= amount;
    this.saveUser();
    this.eventManager.emit(EVENTS.USER_BALANCE_CHANGED, this.user);
    this.eventManager.emit(EVENTS.USER_TRANSACTION, {
      type: 'coin',
      amount: -amount,
      balance: this.user.coinBalance
    });
    return true;
  }

  /**
   * Check if user has sufficient token balance
   */
  public hasTokenBalance(amount: number): boolean {
    return this.user.tokenBalance >= amount;
  }

  /**
   * Check if user has sufficient coin balance
   */
  public hasCoinBalance(amount: number): boolean {
    return this.user.coinBalance >= amount;
  }

  /**
   * Process transaction based on type
   */
  public processTransaction(type: TransactionType): { success: boolean; error?: string } {
    const cost = this.getTransactionCost(type);
    
    if (!this.hasCoinBalance(cost)) {
      return {
        success: false,
        error: ERROR_MESSAGES.INSUFFICIENT_BALANCE
      };
    }

    const success = this.consumeCoins(cost);
    return { success };
  }

  /**
   * Get transaction cost based on type
   */
  private getTransactionCost(type: TransactionType): number {
    switch (type) {
      case TransactionType.PROMPT:
        return this.configManager.getPromptCost();
      case TransactionType.GENERATION:
        return this.configManager.getGenerationCost();
      case TransactionType.UPLOAD:
        return 0.05; // Default upload cost
      default:
        return 0;
    }
  }

  /**
   * Set token balance
   */
  public setTokenBalance(amount: number): void {
    if (amount < 0) return;
    this.user.tokenBalance = amount;
    this.saveUser();
    this.eventManager.emit(EVENTS.USER_BALANCE_CHANGED, this.user);
  }

  /**
   * Set coin balance
   */
  public setCoinBalance(amount: number): void {
    if (amount < 0) return;
    this.user.coinBalance = amount;
    this.saveUser();
    this.eventManager.emit(EVENTS.USER_BALANCE_CHANGED, this.user);
  }

  /**
   * Reset balances to default
   */
  public resetBalances(): void {
    this.user = {
      tokenBalance: 1000,
      coinBalance: 500
    };
    this.saveUser();
    this.eventManager.emit(EVENTS.USER_BALANCE_CHANGED, this.user);
  }

  /**
   * Load user from storage
   */
  private loadUser(): User {
    return this.storageManager.loadUser();
  }

  /**
   * Save user to storage
   */
  private saveUser(): void {
    this.storageManager.saveUser(this.user);
  }

  /**
   * Get balance summary
   */
  public getBalanceSummary(): {
    tokens: number;
    coins: number;
    total: number;
  } {
    return {
      tokens: this.user.tokenBalance,
      coins: this.user.coinBalance,
      total: this.user.tokenBalance + this.user.coinBalance
    };
  }

  /**
   * Format balance for display
   */
  public formatTokenBalance(): string {
    return this.user.tokenBalance.toLocaleString();
  }

  /**
   * Format coin balance for display
   */
  public formatCoinBalance(): string {
    return this.user.coinBalance.toLocaleString();
  }

  /**
   * Check if user can afford transaction
   */
  public canAffordTransaction(type: TransactionType): boolean {
    const cost = this.getTransactionCost(type);
    return this.hasCoinBalance(cost);
  }
}

export default UserBalanceService.getInstance();
