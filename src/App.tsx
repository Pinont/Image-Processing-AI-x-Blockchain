import React from 'react';
import WalletConnect from './components/WalletConnect';
import WaveBackground from './components/WaveBackground';

const App: React.FC = () => {
  return (
    <div className="App">
      <WaveBackground />
      <div className="content">
        <h1 className="title">Web3 Wallet Connection</h1>
        <p className="description">
          Connect your MetaMask wallet to interact with blockchain applications. 
          Securely manage your crypto assets and explore the decentralized web.
        </p>
        <WalletConnect />
      </div>
    </div>
  );
};

export default App;