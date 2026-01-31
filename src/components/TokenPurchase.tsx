import React, { useState, useEffect } from 'react';
import TokenService from '../services/TokenService';
import useWallet from '../hooks/useWallet';
import './TokenPurchase.css';

const TokenPurchase: React.FC = () => {
  const { walletAddress } = useWallet();
  const [ethAmount, setEthAmount] = useState<string>('');
  const [dev3Amount, setDev3Amount] = useState<number>(0);
  const [ethBalance, setEthBalance] = useState<number>(0);
  const [dev3Balance, setDev3Balance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [couponCode, setCouponCode] = useState<string>('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    loadBalances();
  }, [walletAddress]);

  useEffect(() => {
    const eth = parseFloat(ethAmount) || 0;
    setDev3Amount(TokenService.calculateTokenAmount(eth));
  }, [ethAmount]);

  const loadBalances = async () => {
    if (!walletAddress) return;
    
    const eth = await TokenService.getEthBalance();
    const dev3 = TokenService.getBalance();
    setEthBalance(eth);
    setDev3Balance(dev3);
  };

  const handlePurchase = async () => {
    const eth = parseFloat(ethAmount);
    
    if (!eth || eth <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid ETH amount' });
      return;
    }

    if (eth > ethBalance) {
      setMessage({ type: 'error', text: 'Insufficient ETH balance' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: 'info', text: 'Processing transaction...' });

    const result = await TokenService.purchaseTokens(eth);

    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setEthAmount('');
      await loadBalances();
    } else {
      setMessage({ type: 'error', text: result.message });
    }

    setIsLoading(false);
  };

  const handleMaxClick = () => {
    if (ethBalance > 0) {
      // Reserve a small amount for gas fees
      const maxEth = Math.max(0, ethBalance - 0.01);
      setEthAmount(maxEth.toFixed(4));
    }
  };

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter a coupon code' });
      return;
    }

    setIsRedeeming(true);
    setMessage({ type: 'info', text: 'Redeeming coupon...' });

    const result = await TokenService.redeemCoupon(couponCode.trim());

    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setCouponCode('');
      await loadBalances();
    } else {
      setMessage({ type: 'error', text: result.message });
    }

    setIsRedeeming(false);
  };

  return (
    <div className="token-purchase-container">
      <div className="token-purchase-card">
        <div className="token-header">
          <h2>Get {TokenService.getTokenSymbol()}</h2>
          <p className="token-description">
            Exchange ETH for {TokenService.getTokenName()} - The currency of this platform
          </p>
        </div>

        <div className="balance-display">
          <div className="balance-item">
            <span className="balance-label">Your ETH Balance:</span>
            <span className="balance-value">{ethBalance.toFixed(4)} ETH</span>
          </div>
          <div className="balance-item">
            <span className="balance-label">Your DEV3 Balance:</span>
            <span className="balance-value">{dev3Balance.toFixed(2)} {TokenService.getTokenSymbol()}</span>
          </div>
        </div>

        <div className="exchange-rate-info">
          <div className="rate-box">
            <span className="rate-label">Exchange Rate:</span>
            <span className="rate-value">1 {TokenService.getTokenSymbol()} = {TokenService.getTokenPrice()} ETH</span>
          </div>
        </div>

        <div className="purchase-form">
          <div className="input-group">
            <label htmlFor="eth-amount">ETH Amount</label>
            <div className="input-wrapper">
              <input
                id="eth-amount"
                type="number"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
                placeholder="0.0"
                step="0.001"
                min="0"
                disabled={isLoading}
              />
              <button 
                className="max-btn" 
                onClick={handleMaxClick}
                disabled={isLoading}
              >
                MAX
              </button>
            </div>
          </div>

          <div className="swap-icon">⇩</div>

          <div className="input-group">
            <label>You Will Receive</label>
            <div className="output-box">
              <span className="token-amount">{dev3Amount.toFixed(2)}</span>
              <span className="token-symbol">{TokenService.getTokenSymbol()}</span>
            </div>
          </div>

          <button 
            className="purchase-btn"
            onClick={handlePurchase}
            disabled={isLoading || !ethAmount || parseFloat(ethAmount) <= 0 || isRedeeming}
          >
            {isLoading ? 'Processing...' : 'Purchase DEV3'}
          </button>

          <div className="divider-text">OR</div>

          <div className="coupon-section">
            <label htmlFor="coupon-code">Have a Coupon Code?</label>
            <div className="coupon-wrapper">
              <input
                id="coupon-code"
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                disabled={isRedeeming || isLoading}
              />
              <button 
                className="redeem-btn" 
                onClick={handleRedeemCoupon}
                disabled={isRedeeming || isLoading || !couponCode.trim()}
              >
                {isRedeeming ? 'Redeeming...' : 'Redeem'}
              </button>
            </div>
          </div>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>

        <div className="purchase-info">
          <h3>How it works:</h3>
          <ol>
            <li>Enter the amount of ETH you want to spend</li>
            <li>See how many {TokenService.getTokenSymbol()} you'll receive</li>
            <li>Click "Purchase DEV3" to complete the exchange</li>
            <li>Your DEV3 will be added to your balance instantly</li>
            <li>Or enter a coupon code to redeem free DEV3</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TokenPurchase;
