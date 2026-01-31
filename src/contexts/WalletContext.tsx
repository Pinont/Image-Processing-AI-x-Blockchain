import React, { createContext, useState, ReactNode } from 'react';

interface WalletContextType {
  walletAddress: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      alert("MetaMask is not installed. Please install MetaMask to use this app.");
    }
  };

  const disconnectWallet = () => {
    // Clear wallet address first
    const currentAddress = walletAddress;
    setWalletAddress(null);
    
    // Clear localStorage for this wallet
    if (currentAddress) {
      localStorage.removeItem(`dev3_balance_${currentAddress}`);
      localStorage.removeItem(`redeemed_coupons_${currentAddress}`);
    }
    
    // Emit event for other components to react
    if (typeof window !== 'undefined' && (window as any).EventManager) {
      (window as any).EventManager.emit('WALLET_DISCONNECTED');
    }
  };

  return (
    <WalletContext.Provider value={{ walletAddress, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};