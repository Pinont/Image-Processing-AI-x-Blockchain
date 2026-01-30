import React from 'react';
import WalletConnect from './components/WalletConnect';
import WaveBackground from './components/WaveBackground';

const App: React.FC = () => {
  return (
    <div className="App">
      <WaveBackground />
      <div className="content">
        <h1 className="title">Carbon Token</h1>
        <WalletConnect />
      </div>
    </div>
  );
};

export default App;