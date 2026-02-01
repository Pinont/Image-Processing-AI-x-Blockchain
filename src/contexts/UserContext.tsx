import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import { WalletContext } from './WalletContext';

interface UserContextType {
  MINDBalance: number;
  consumeMIND: (amount: number) => boolean;
  addMIND: (amount: number) => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const walletContext = useContext(WalletContext);
  const [MINDBalance, setMINDBalance] = useState<number>(1000); // Starting MIND balance

  // Load user data from localStorage when wallet connects
  useEffect(() => {
    if (walletContext?.walletAddress) {
      const savedMIND = localStorage.getItem(`MIND_balance_${walletContext.walletAddress}`);

      if (savedMIND) setMINDBalance(parseFloat(savedMIND));
    }
  }, [walletContext?.walletAddress]);

  // Save user data to localStorage
  useEffect(() => {
    if (walletContext?.walletAddress) {
      localStorage.setItem(`MIND_balance_${walletContext.walletAddress}`, MINDBalance.toString());
    }
  }, [MINDBalance, walletContext?.walletAddress]);

  const consumeMIND = (amount: number): boolean => {
    if (MINDBalance >= amount) {
      setMINDBalance(prev => parseFloat((prev - amount).toFixed(2)));
      return true;
    }
    return false;
  };

  const addMIND = (amount: number) => {
    setMINDBalance(prev => parseFloat((prev + amount).toFixed(2)));
  };

  return (
    <UserContext.Provider value={{ MINDBalance, consumeMIND, addMIND }}>
      {children}
    </UserContext.Provider>
  );
};
