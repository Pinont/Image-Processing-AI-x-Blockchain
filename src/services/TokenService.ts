import { ethers } from 'ethers';
import EventManager, { EVENTS } from '../managers/EventManager';

/**
 * TokenService - Handles token purchase and balance management
 */
export class TokenService {
  private static instance: TokenService;
  private provider: ethers.providers.Web3Provider | null = null;
  private dev3Balance: number = 0;
  private readonly DEV3_PRICE_ETH = 0.001; // 1 DEV3 = 0.001 ETH
  private readonly DEV3_NAME = 'DEV3';
  private readonly DEV3_SYMBOL = 'DEV3';

  private constructor() {
    this.initializeProvider();
    this.loadTokenBalance();
    this.setupWalletListener();
  }

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  private initializeProvider(): void {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.provider = new ethers.providers.Web3Provider((window as any).ethereum);
    }
  }

  /**
   * Setup listener for wallet account changes
   */
  private setupWalletListener(): void {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          // Reload balance for new account
          this.loadTokenBalance();
          EventManager.emit(EVENTS.TOKEN_BALANCE_UPDATED, { balance: this.dev3Balance });
        }
      });
    }
  }

  private loadTokenBalance(): void {
    const account = this.getCurrentAccount();
    if (account) {
      const stored = localStorage.getItem(`dev3_balance_${account}`);
      this.dev3Balance = stored ? parseFloat(stored) : 0;
    }
  }

  private saveTokenBalance(): void {
    const account = this.getCurrentAccount();
    if (account) {
      // Save to localStorage with wallet address
      localStorage.setItem(`dev3_balance_${account}`, this.dev3Balance.toString());
      
      // Save last update timestamp
      localStorage.setItem(`dev3_balance_updated_${account}`, Date.now().toString());
      
      // In production, this would mint/transfer tokens to the wallet address via smart contract
      // Example: await this.dev3Contract.mint(account, ethers.utils.parseUnits(this.dev3Balance.toString(), 18));
    }
  }

  private getCurrentAccount(): string | null {
    if (!this.provider) return null;
    
    // Get account from provider
    const ethereum = (window as any).ethereum;
    return ethereum?.selectedAddress || null;
  }

  /**
   * Get current DEV3 balance for connected wallet
   */
  public getBalance(): number {
    // Reload balance to ensure it's current for the active wallet
    this.loadTokenBalance();
    return this.dev3Balance;
  }

  /**
   * Get balance for a specific wallet address
   */
  public getBalanceForAddress(address: string): number {
    const stored = localStorage.getItem(`dev3_balance_${address}`);
    return stored ? parseFloat(stored) : 0;
  }

  /**
   * Get DEV3 price in ETH
   */
  public getTokenPrice(): number {
    return this.DEV3_PRICE_ETH;
  }

  /**
   * Get DEV3 name
   */
  public getTokenName(): string {
    return this.DEV3_NAME;
  }

  /**
   * Get DEV3 symbol
   */
  public getTokenSymbol(): string {
    return this.DEV3_SYMBOL;
  }

  /**
   * Calculate how many DEV3 can be purchased with given ETH amount
   */
  public calculateTokenAmount(ethAmount: number): number {
    return ethAmount / this.DEV3_PRICE_ETH;
  }

  /**
   * Calculate ETH cost for given DEV3 amount
   */
  public calculateEthCost(tokenAmount: number): number {
    return tokenAmount * this.DEV3_PRICE_ETH;
  }

  /**
   * Purchase tokens with ETH
   */
  public async purchaseTokens(ethAmount: number): Promise<{ success: boolean; message: string; tokens?: number }> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const account = this.getCurrentAccount();
      if (!account) {
        throw new Error('No wallet connected');
      }

      // Get current ETH balance
      const balance = await this.provider.getBalance(account);
      const balanceEth = parseFloat(ethers.utils.formatEther(balance));

      if (balanceEth < ethAmount) {
        throw new Error('Insufficient ETH balance');
      }

      // Calculate DEV3 to receive
      const dev3ToReceive = this.calculateTokenAmount(ethAmount);

      // In a real application, you would send ETH to a contract
      // For this demo, we'll simulate the purchase
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Add DEV3 to balance
      this.dev3Balance += dev3ToReceive;
      this.saveTokenBalance();

      // Emit event
      EventManager.emit(EVENTS.TOKEN_PURCHASED, {
        ethAmount,
        tokensReceived: dev3ToReceive,
        newBalance: this.dev3Balance
      });

      return {
        success: true,
        message: `Successfully purchased ${dev3ToReceive.toFixed(2)} ${this.DEV3_SYMBOL}`,
        tokens: dev3ToReceive
      };

    } catch (error: any) {
      console.error('Token purchase error:', error);
      return {
        success: false,
        message: error.message || 'Failed to purchase tokens'
      };
    }
  }

  /**
   * Get ETH balance for current account
   */
  public async getEthBalance(): Promise<number> {
    try {
      if (!this.provider) return 0;
      
      const account = this.getCurrentAccount();
      if (!account) return 0;

      const balance = await this.provider.getBalance(account);
      return parseFloat(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error('Error getting ETH balance:', error);
      return 0;
    }
  }

  /**
   * Claim free tokens (for testing purposes)
   */
  public async claimFreeTokens(): Promise<{ success: boolean; message: string; tokens?: number }> {
    try {
      const account = this.getCurrentAccount();
      if (!account) {
        throw new Error('No wallet connected');
      }

      const FREE_DEV3_AMOUNT = 1000; // Give 1000 free DEV3
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Add free DEV3 to balance
      this.dev3Balance += FREE_DEV3_AMOUNT;
      this.saveTokenBalance();

      // Emit event
      EventManager.emit(EVENTS.TOKEN_PURCHASED, {
        ethAmount: 0,
        tokensReceived: FREE_DEV3_AMOUNT,
        newBalance: this.dev3Balance
      });

      return {
        success: true,
        message: `Successfully claimed ${FREE_DEV3_AMOUNT} free ${this.DEV3_SYMBOL}!`,
        tokens: FREE_DEV3_AMOUNT
      };

    } catch (error: any) {
      console.error('Free token claim error:', error);
      return {
        success: false,
        message: error.message || 'Failed to claim free tokens'
      };
    }
  }

  /**
   * Redeem coupon code for DEV3
   */
  public async redeemCoupon(couponCode: string): Promise<{ success: boolean; message: string; tokens?: number }> {
    try {
      const account = this.getCurrentAccount();
      if (!account) {
        throw new Error('No wallet connected');
      }

      // Check if coupon was already redeemed
      const redeemedCoupons = localStorage.getItem(`redeemed_coupons_${account}`);
      const couponsArray = redeemedCoupons ? JSON.parse(redeemedCoupons) : [];
      
      if (couponsArray.includes(couponCode)) {
        throw new Error('This coupon code has already been redeemed');
      }

      // Validate coupon code
      let rewardAmount = 0;
      
      if (couponCode === 'FREEDEV3TK1000') {
        rewardAmount = 1000;
      } else {
        throw new Error('Invalid coupon code');
      }

      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Add DEV3 to balance
      this.dev3Balance += rewardAmount;
      this.saveTokenBalance();

      // Mark coupon as redeemed
      couponsArray.push(couponCode);
      localStorage.setItem(`redeemed_coupons_${account}`, JSON.stringify(couponsArray));

      // Emit event
      EventManager.emit(EVENTS.TOKEN_PURCHASED, {
        ethAmount: 0,
        tokensReceived: rewardAmount,
        newBalance: this.dev3Balance
      });

      return {
        success: true,
        message: `Coupon redeemed! You received ${rewardAmount} ${this.DEV3_SYMBOL}!`,
        tokens: rewardAmount
      };

    } catch (error: any) {
      console.error('Coupon redemption error:', error);
      return {
        success: false,
        message: error.message || 'Failed to redeem coupon'
      };
    }
  }

  /**
   * Add DEV3 tokens to user's balance
   */
  public addTokens(amount: number): { success: boolean; message: string; newBalance: number } {
    try {
      const account = this.getCurrentAccount();
      if (!account) {
        throw new Error('No wallet connected');
      }

      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Add tokens to balance
      this.dev3Balance += amount;
      this.saveTokenBalance();

      // Emit event
      EventManager.emit(EVENTS.TOKEN_PURCHASED, {
        ethAmount: 0,
        tokensReceived: amount,
        newBalance: this.dev3Balance
      });

      return {
        success: true,
        message: `Successfully added ${amount.toFixed(2)} ${this.DEV3_SYMBOL} to your account`,
        newBalance: this.dev3Balance
      };

    } catch (error: any) {
      console.error('Add tokens error:', error);
      return {
        success: false,
        message: error.message || 'Failed to add tokens',
        newBalance: this.dev3Balance
      };
    }
  }

  /**
   * Set DEV3 balance to a specific amount
   */
  public setBalance(amount: number): { success: boolean; message: string; newBalance: number } {
    try {
      const account = this.getCurrentAccount();
      if (!account) {
        throw new Error('No wallet connected');
      }

      if (amount < 0) {
        throw new Error('Balance cannot be negative');
      }

      // Set balance
      const oldBalance = this.dev3Balance;
      this.dev3Balance = amount;
      this.saveTokenBalance();

      // Emit event
      EventManager.emit(EVENTS.TOKEN_PURCHASED, {
        ethAmount: 0,
        tokensReceived: amount - oldBalance,
        newBalance: this.dev3Balance
      });

      return {
        success: true,
        message: `Balance set to ${amount.toFixed(2)} ${this.DEV3_SYMBOL}`,
        newBalance: this.dev3Balance
      };

    } catch (error: any) {
      console.error('Set balance error:', error);
      return {
        success: false,
        message: error.message || 'Failed to set balance',
        newBalance: this.dev3Balance
      };
    }
  }

  /**
   * Manually save current balance to localStorage
   */
  public saveBalance(): void {
    this.saveTokenBalance();
  }

  /**
   * Reset DEV3 balance (for testing)
   */
  public resetBalance(): void {
    this.dev3Balance = 0;
    this.saveTokenBalance();
    EventManager.emit(EVENTS.TOKEN_BALANCE_UPDATED, { balance: 0 });
  }
}

export default TokenService.getInstance();
