import { ethers } from 'ethers';
import EventManager, { EVENTS } from '../managers/EventManager';

/**
 * TokenService - Handles token purchase and balance management
 */
export class TokenService {
  private static instance: TokenService;
  private provider: ethers.providers.Web3Provider | null = null;
  private MINDBalance: number = 0;
  private readonly MIND_PRICE_ETH = 0.001; // 1 MIND = 0.001 ETH
  private readonly MIND_NAME = 'Decentral Mind Token';
  private readonly MIND_SYMBOL = 'MIND';

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
          EventManager.emit(EVENTS.TOKEN_BALANCE_UPDATED, { balance: this.MINDBalance });
        }
      });
    }
  }

  private loadTokenBalance(): void {
    const account = this.getCurrentAccount();
    if (account) {
      const stored = localStorage.getItem(`MIND_balance_${account}`);
      this.MINDBalance = stored ? parseFloat(stored) : 0;
    }
  }

  private saveTokenBalance(): void {
    const account = this.getCurrentAccount();
    if (account) {
      // Save to localStorage with wallet address
      localStorage.setItem(`MIND_balance_${account}`, this.MINDBalance.toString());

      // Save last update timestamp
      localStorage.setItem(`MIND_balance_updated_${account}`, Date.now().toString());

      // In production, this would mint/transfer tokens to the wallet address via smart contract
      // Example: await this.MINDContract.mint(account, ethers.utils.parseUnits(this.MINDBalance.toString(), 18));
    }
  }

  private getCurrentAccount(): string | null {
    if (!this.provider) return null;

    // Get account from provider
    const ethereum = (window as any).ethereum;
    return ethereum?.selectedAddress || null;
  }

  /**
   * Get current MIND balance for connected wallet
   */
  public getBalance(): number {
    // Reload balance to ensure it's current for the active wallet
    this.loadTokenBalance();
    return this.MINDBalance;
  }

  /**
   * Get balance for a specific wallet address
   */
  public getBalanceForAddress(address: string): number {
    const stored = localStorage.getItem(`MIND_balance_${address}`);
    return stored ? parseFloat(stored) : 0;
  }

  /**
   * GET MIND price in ETH
   */
  public getTokenPrice(): number {
    return this.MIND_PRICE_ETH;
  }

  /**
   * GET MIND name
   */
  public getTokenName(): string {
    return this.MIND_NAME;
  }

  /**
   * GET MIND symbol
   */
  public getTokenSymbol(): string {
    return this.MIND_SYMBOL;
  }

  /**
   * Calculate how many MIND can be purchased with given ETH amount
   */
  public calculateTokenAmount(ethAmount: number): number {
    return ethAmount / this.MIND_PRICE_ETH;
  }

  /**
   * Calculate ETH cost for given MIND amount
   */
  public calculateEthCost(tokenAmount: number): number {
    return tokenAmount * this.MIND_PRICE_ETH;
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

      // Calculate MIND to receive
      const MINDToReceive = this.calculateTokenAmount(ethAmount);

      // In a real application, you would send ETH to a contract
      // For this demo, we'll simulate the purchase

      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Add MIND to balance
      this.MINDBalance += MINDToReceive;
      this.saveTokenBalance();

      // Emit event
      EventManager.emit(EVENTS.TOKEN_PURCHASED, {
        ethAmount,
        tokensReceived: MINDToReceive,
        newBalance: this.MINDBalance
      });

      return {
        success: true,
        message: `Successfully purchased ${MINDToReceive.toFixed(2)} ${this.MIND_SYMBOL}`,
        tokens: MINDToReceive
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

      const FREE_MIND_AMOUNT = 1000; // Give 1000 free MIND

      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Add free MIND to balance
      this.MINDBalance += FREE_MIND_AMOUNT;
      this.saveTokenBalance();

      // Emit event
      EventManager.emit(EVENTS.TOKEN_PURCHASED, {
        ethAmount: 0,
        tokensReceived: FREE_MIND_AMOUNT,
        newBalance: this.MINDBalance
      });

      return {
        success: true,
        message: `Successfully claimed ${FREE_MIND_AMOUNT} free ${this.MIND_SYMBOL}!`,
        tokens: FREE_MIND_AMOUNT
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
   * Redeem coupon code for MIND
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

      if (couponCode === 'FREEMINDTK1000') {
        rewardAmount = 1000;
      } else {
        throw new Error('Invalid coupon code');
      }

      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Add MIND to balance
      this.MINDBalance += rewardAmount;
      this.saveTokenBalance();

      // Mark coupon as redeemed
      couponsArray.push(couponCode);
      localStorage.setItem(`redeemed_coupons_${account}`, JSON.stringify(couponsArray));

      // Emit event
      EventManager.emit(EVENTS.TOKEN_PURCHASED, {
        ethAmount: 0,
        tokensReceived: rewardAmount,
        newBalance: this.MINDBalance
      });

      return {
        success: true,
        message: `Coupon redeemed! You received ${rewardAmount} ${this.MIND_SYMBOL}!`,
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
   * Add MIND tokens to user's balance
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
      this.MINDBalance += amount;
      this.saveTokenBalance();

      // Emit event
      EventManager.emit(EVENTS.TOKEN_PURCHASED, {
        ethAmount: 0,
        tokensReceived: amount,
        newBalance: this.MINDBalance
      });

      return {
        success: true,
        message: `Successfully added ${amount.toFixed(2)} ${this.MIND_SYMBOL} to your account`,
        newBalance: this.MINDBalance
      };

    } catch (error: any) {
      console.error('Add tokens error:', error);
      return {
        success: false,
        message: error.message || 'Failed to add tokens',
        newBalance: this.MINDBalance
      };
    }
  }

  /**
   * Set MIND balance to a specific amount
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
      const oldBalance = this.MINDBalance;
      this.MINDBalance = amount;
      this.saveTokenBalance();

      // Emit event
      EventManager.emit(EVENTS.TOKEN_PURCHASED, {
        ethAmount: 0,
        tokensReceived: amount - oldBalance,
        newBalance: this.MINDBalance
      });

      return {
        success: true,
        message: `Balance set to ${amount.toFixed(2)} ${this.MIND_SYMBOL}`,
        newBalance: this.MINDBalance
      };

    } catch (error: any) {
      console.error('Set balance error:', error);
      return {
        success: false,
        message: error.message || 'Failed to set balance',
        newBalance: this.MINDBalance
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
   * Reset MIND balance (for testing)
   */
  public resetBalance(): void {
    this.MINDBalance = 0;
    this.saveTokenBalance();
    EventManager.emit(EVENTS.TOKEN_BALANCE_UPDATED, { balance: 0 });
  }
}

export default TokenService.getInstance();
