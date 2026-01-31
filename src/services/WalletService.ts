import Web3 from 'web3';
import { WalletState } from '../types';
import StorageManager from '../managers/StorageManager';
import EventManager, { EVENTS } from '../managers/EventManager';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';

/**
 * WalletService - Service class for managing Web3 wallet connections
 */
export class WalletService {
  private static instance: WalletService;
  private web3: Web3 | null = null;
  private state: WalletState;
  private storageManager: typeof StorageManager;
  private eventManager: typeof EventManager;

  private constructor() {
    this.state = {
      account: null,
      isConnecting: false,
      error: null
    };
    this.storageManager = StorageManager;
    this.eventManager = EventManager;
    this.initializeWeb3();
  }

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * Initialize Web3
   */
  private initializeWeb3(): void {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.web3 = new Web3((window as any).ethereum);
      this.setupEventListeners();
      this.tryAutoConnect();
    }
  }

  /**
   * Setup MetaMask event listeners
   */
  private setupEventListeners(): void {
    if ((window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
      (window as any).ethereum.on('chainChanged', this.handleChainChanged.bind(this));
      (window as any).ethereum.on('disconnect', this.handleDisconnect.bind(this));
    }
  }

  /**
   * Handle account change
   */
  private handleAccountsChanged(accounts: string[]): void {
    if (accounts.length === 0) {
      this.disconnect();
    } else if (accounts[0] !== this.state.account) {
      this.state.account = accounts[0];
      this.storageManager.saveWalletAddress(accounts[0]);
      this.eventManager.emit(EVENTS.WALLET_CONNECTED, accounts[0]);
    }
  }

  /**
   * Handle chain change
   */
  private handleChainChanged(): void {
    // Reload the page on chain change as recommended by MetaMask
    window.location.reload();
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(): void {
    this.disconnect();
  }

  /**
   * Try to auto-connect if previously connected
   */
  private async tryAutoConnect(): Promise<void> {
    const savedAddress = this.storageManager.loadWalletAddress();
    if (savedAddress && this.web3) {
      try {
        const accounts = await this.web3.eth.getAccounts();
        if (accounts.includes(savedAddress)) {
          this.state.account = savedAddress;
          this.eventManager.emit(EVENTS.WALLET_CONNECTED, savedAddress);
        }
      } catch (error) {
        console.error('Auto-connect failed:', error);
      }
    }
  }

  /**
   * Connect wallet
   */
  public async connect(): Promise<string> {
    if (!this.web3 || !(window as any).ethereum) {
      const error = 'MetaMask is not installed';
      this.state.error = error;
      this.eventManager.emit(EVENTS.WALLET_ERROR, error);
      throw new Error(error);
    }

    this.state.isConnecting = true;
    this.state.error = null;

    try {
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.state.account = accounts[0];
      this.state.isConnecting = false;
      
      this.storageManager.saveWalletAddress(accounts[0]);
      this.eventManager.emit(EVENTS.WALLET_CONNECTED, accounts[0]);

      return accounts[0];
    } catch (error) {
      this.state.isConnecting = false;
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.WALLET_NOT_CONNECTED;
      this.state.error = errorMessage;
      this.eventManager.emit(EVENTS.WALLET_ERROR, errorMessage);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  public disconnect(): void {
    this.state.account = null;
    this.state.error = null;
    this.storageManager.remove('wallet_address');
    this.eventManager.emit(EVENTS.WALLET_DISCONNECTED);
  }

  /**
   * Get current account
   */
  public getAccount(): string | null {
    return this.state.account;
  }

  /**
   * Get wallet state
   */
  public getState(): WalletState {
    return { ...this.state };
  }

  /**
   * Check if wallet is connected
   */
  public isConnected(): boolean {
    return this.state.account !== null;
  }

  /**
   * Check if wallet is connecting
   */
  public isConnecting(): boolean {
    return this.state.isConnecting;
  }

  /**
   * Get account balance in ETH
   */
  public async getBalance(): Promise<string> {
    if (!this.web3 || !this.state.account) {
      throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
    }

    try {
      const balance = await this.web3.eth.getBalance(this.state.account);
      return this.web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current network ID
   */
  public async getNetworkId(): Promise<number> {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }

    try {
      const networkId = await this.web3.eth.net.getId();
      return Number(networkId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current chain ID
   */
  public async getChainId(): Promise<number> {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }

    try {
      const chainId = await this.web3.eth.net.getId();
      return Number(chainId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign message
   */
  public async signMessage(message: string): Promise<string> {
    if (!this.web3 || !this.state.account) {
      throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
    }

    try {
      const signature = await (window as any).ethereum.request({
        method: 'personal_sign',
        params: [message, this.state.account]
      });
      return signature;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send transaction
   */
  public async sendTransaction(to: string, value: string): Promise<string> {
    if (!this.web3 || !this.state.account) {
      throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
    }

    try {
      const valueInWei = this.web3.utils.toWei(value, 'ether');
      const receipt = await this.web3.eth.sendTransaction({
        from: this.state.account,
        to,
        value: valueInWei
      });
      return receipt.transactionHash;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Format address (short version)
   */
  public formatAddress(address: string, length: number = 4): string {
    if (!address) return '';
    return `${address.substring(0, length + 2)}...${address.substring(address.length - length)}`;
  }

  /**
   * Get formatted current address
   */
  public getFormattedAddress(length: number = 4): string {
    if (!this.state.account) return '';
    return this.formatAddress(this.state.account, length);
  }

  /**
   * Check if MetaMask is installed
   */
  public isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && !!(window as any).ethereum;
  }

  /**
   * Get error message
   */
  public getError(): string | null {
    return this.state.error;
  }

  /**
   * Clear error
   */
  public clearError(): void {
    this.state.error = null;
  }
}

export default WalletService.getInstance();
