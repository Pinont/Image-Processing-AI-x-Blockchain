import Web3 from 'web3';

let web3: Web3 | null = null;

export const initWeb3 = async (): Promise<Web3 | null> => {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            return web3;
        } catch (error) {
            console.error("User denied account access", error);
            return null;
        }
    } else {
        console.error("No Ethereum provider found. Install MetaMask.");
        return null;
    }
};

export const getWeb3Instance = (): Web3 | null => {
    return web3;
};