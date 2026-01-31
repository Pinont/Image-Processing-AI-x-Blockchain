import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import { WalletContext } from './WalletContext';

interface UserContextType {
  tokens: number;
  coinBalance: number;
  consumeTokens: (amount: number) => boolean;
  consumeCoins: (amount: number) => boolean;
  addTokens: (amount: number) => void;
  addCoins: (amount: number) => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const walletContext = useContext(WalletContext);
  const [tokens, setTokens] = useState<number>(1000); // Starting tokens
  const [coinBalance, setCoinBalance] = useState<number>(0); // Starting coin balance

  // Load user data from localStorage when wallet connects
  useEffect(() => {
    if (walletContext?.walletAddress) {
      const savedTokens = localStorage.getItem(`tokens_${walletContext.walletAddress}`);
      const savedCoins = localStorage.getItem(`coins_${walletContext.walletAddress}`);
      
      if (savedTokens) setTokens(parseInt(savedTokens));
      if (savedCoins) setCoinBalance(parseFloat(savedCoins));
    }
  }, [walletContext?.walletAddress]);

  // Save user data to localStorage
  useEffect(() => {
    if (walletContext?.walletAddress) {
      localStorage.setItem(`tokens_${walletContext.walletAddress}`, tokens.toString());
      localStorage.setItem(`coins_${walletContext.walletAddress}`, coinBalance.toString());
    }
  }, [tokens, coinBalance, walletContext?.walletAddress]);

  const consumeTokens = (amount: number): boolean => {
    if (tokens >= amount) {
      setTokens(prev => prev - amount);
      return true;
    }
    return false;
  };

  const consumeCoins = (amount: number): boolean => {
    if (coinBalance >= amount) {
      setCoinBalance(prev => parseFloat((prev - amount).toFixed(8)));
      return true;
    }
    return false;
  };

  const addTokens = (amount: number) => {
    setTokens(prev => prev + amount);
  };

  const addCoins = (amount: number) => {
    setCoinBalance(prev => prev + amount);
  };

  return (
    <UserContext.Provider value={{ tokens, coinBalance, consumeTokens, consumeCoins, addTokens, addCoins }}>
      {children}
    </UserContext.Provider>
  );
};
