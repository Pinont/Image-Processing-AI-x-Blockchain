import { useContext } from 'react';
import { WalletContext } from '../contexts/WalletContext';

const useWallet = () => {
    const context = useContext(WalletContext);
    
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    
    const { walletAddress, connectWallet, disconnectWallet } = context;

    return {
        walletAddress,
        connectWallet,
        disconnectWallet,
    };
};

export default useWallet;