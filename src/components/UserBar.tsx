import React from 'react';
import useWallet from '../hooks/useWallet';
import { useUser } from '../hooks/useUser';
import './UserBar.css';

const UserBar: React.FC = () => {
  const { walletAddress, disconnectWallet } = useWallet();
  const { tokens, coinBalance } = useUser();

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="user-bar">
      <div className="user-bar-content">
        <div className="user-bar-left">
        </div>

        <div className="user-bar-right">
          {/* Wallet Display with Token and Coin */}
          {walletAddress && (
            <div className="user-wallet">
              <div className="wallet-address">
                <div className="wallet-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="6" width="18" height="13" rx="2" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h.01M11 15h2" />
                  </svg>
                </div>
                <span>{formatAddress(walletAddress)}</span>
              </div>
              
              {/* Stats shown on hover */}
              <div className="wallet-stats">
                {/* Token Display */}
                <div className="user-stat">
                  <div className="stat-icon token-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth={2} />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Tokens</span>
                    <span className="stat-value">{formatNumber(tokens)}</span>
                  </div>
                </div>

                {/* Coin Display */}
                <div className="user-stat">
                  <div className="stat-icon coin-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Coins</span>
                    <span className="stat-value">{coinBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <button onClick={disconnectWallet} className="disconnect-btn" title="Disconnect Wallet">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserBar;
