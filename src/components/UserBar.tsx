import React, { useState, useEffect } from 'react';
import useWallet from '../hooks/useWallet';
import TokenService from '../services/TokenService';
import EventManager, { EVENTS } from '../managers/EventManager';
import './UserBar.css';

const UserBar: React.FC = () => {
  const { walletAddress, disconnectWallet } = useWallet();
  const [MINDBalance, setMINDBalance] = useState<number>(0);
  const [ethBalance, setEthBalance] = useState<number>(0);

  const handleDisconnect = () => {
    console.log('Disconnecting wallet...');
    disconnectWallet();
  };

  useEffect(() => {
    loadBalances();

    // Subscribe to balance updates
    const unsubscribe = EventManager.on(EVENTS.TOKEN_PURCHASED, () => {
      loadBalances();
    });

    return () => {
      unsubscribe();
    };
  }, [walletAddress]);

  const loadBalances = async () => {
    if (!walletAddress) return;
    setMINDBalance(TokenService.getBalance());
    const eth = await TokenService.getEthBalance();
    setEthBalance(eth);
  };

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
                {/* MIND Balance */}
                <div className="user-stat">
                  <div className="stat-icon MIND-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10" />
                      <text x="12" y="16" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">D3</text>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">MIND</span>
                    <span className="stat-value">{MINDBalance.toFixed(2)}</span>
                  </div>
                </div>

                {/* ETH Balance */}
                <div className="user-stat">
                  <div className="stat-icon eth-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L4 12.5l8 4.5 8-4.5L12 2zm0 13l-8-4.5L12 22l8-11.5-8 4.5z" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">ETH</span>
                    <span className="stat-value">{ethBalance.toFixed(4)}</span>
                  </div>
                </div>
              </div>

              <button onClick={handleDisconnect} className="disconnect-btn" title="Disconnect Wallet">
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
