import React, { useContext } from 'react';
import { WalletContext } from '../contexts/WalletContext';

const WalletConnect: React.FC = () => {
    const { connectWallet, disconnectWallet, walletAddress } = useContext(WalletContext);

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