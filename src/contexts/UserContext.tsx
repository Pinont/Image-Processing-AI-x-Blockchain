import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import { WalletContext } from './WalletContext';

interface UserContextType {
  dev3Balance: number;
  consumeDev3: (amount: number) => boolean;
  addDev3: (amount: number) => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const walletContext = useContext(WalletContext);
  const [dev3Balance, setDev3Balance] = useState<number>(1000); // Starting DEV3 balance

  // Load user data from localStorage when wallet connects
  useEffect(() => {
    if (walletContext?.walletAddress) {
      const savedDev3 = localStorage.getItem(`dev3_balance_${walletContext.walletAddress}`);
      
      if (savedDev3) setDev3Balance(parseFloat(savedDev3));
    }
  }, [walletContext?.walletAddress]);

  // Save user data to localStorage
  useEffect(() => {
    if (walletContext?.walletAddress) {
      localStorage.setItem(`dev3_balance_${walletContext.walletAddress}`, dev3Balance.toString());
    }
  }, [dev3Balance, walletContext?.walletAddress]);

  const consumeDev3 = (amount: number): boolean => {
    if (dev3Balance >= amount) {
      setDev3Balance(prev => parseFloat((prev - amount).toFixed(2)));
      return true;
    }
    return false;
  };

  const addDev3 = (amount: number) => {
    setDev3Balance(prev => parseFloat((prev + amount).toFixed(2)));
  };

  return (
    <UserContext.Provider value={{ dev3Balance, consumeDev3, addDev3 }}>
      {children}
    </UserContext.Provider>
  );
};
