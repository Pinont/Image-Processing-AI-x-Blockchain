import React, { useContext } from 'react';
import { WalletContext } from '../contexts/WalletContext';

const WalletConnect: React.FC = () => {
    const walletContext = useContext(WalletContext);
    
    if (!walletContext) {
        return <div>Loading...</div>;
    }
    
    const { connectWallet, disconnectWallet, walletAddress } = walletContext;

    return (
        <div className="wallet-connect">
            {walletAddress ? (
                <div>
                    <p>Connected: {walletAddress}</p>
                    <button onClick={disconnectWallet}>Disconnect</button>
                </div>
            ) : (
                <button onClick={connectWallet}>Connect Wallet</button>
            )}
        </div>
    );
};

export default WalletConnect;