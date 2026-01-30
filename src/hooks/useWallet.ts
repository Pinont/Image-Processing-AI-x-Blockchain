import { useContext } from 'react';
import { WalletContext } from '../contexts/WalletContext';

const useWallet = () => {
    const { walletAddress, connectWallet, disconnectWallet } = useContext(WalletContext);

    return {
        walletAddress,
        connectWallet,
        disconnectWallet,
    };
};

export default useWallet;