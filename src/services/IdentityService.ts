import { IpfsService } from './IpfsService';

// Types for our Identity Data
export interface IdentityData {
    profile: {
        username: string;
        bio: string;
        avatar?: string;
    };
    chats: ChatSession[];
    lastUpdated: number;
}

export interface ChatSession {
    id: string;
    messages: ChatMessage[];
}

export interface ChatMessage {
    sender: 'user' | 'bot';
    content: string;
    timestamp: number;
}

// Default empty identity
const DEFAULT_IDENTITY: IdentityData = {
    profile: {
        username: 'New User',
        bio: 'Ready to explore Web3',
    },
    chats: [],
    lastUpdated: Date.now(),
};

class IdentityService {
    // Local cache of the latest known CID for a user
    private knownCids: Map<string, string> = new Map();

    /**
     * Loads identity for a given wallet address.
     * 1. Check Smart Contract for CID (Mocked for now).
     * 2. Fetch data from IPFS.
     */
    async loadIdentity(startAddress: string): Promise<IdentityData> {
        const address = startAddress.toLowerCase();

        // MOCK: Get CID from "Smart Contract" (using LocalStorage to simulate Chain state)
        // In real impl, this would be: const cid = await identityContract.getIdentity(address);
        const chainCid = localStorage.getItem(`contract_identity_${address}`);

        if (!chainCid) {
            console.log(`[IdentityService] No identity found on-chain for ${address}. Returning default.`);
            return DEFAULT_IDENTITY;
        }

        try {
            console.log(`[IdentityService] Found On-Chain CID: ${chainCid}. Fetching from IPFS...`);
            const data = await IpfsService.fetch<IdentityData>(chainCid);
            this.knownCids.set(address, chainCid);
            return data;
        } catch (error) {
            console.error(`[IdentityService] Failed to load identity data for CID ${chainCid}`, error);
            return DEFAULT_IDENTITY;
        }
    }

    /**
     * Saves identity data.
     * 1. Uploads to IPFS -> Returns CID.
     * 2. Returns CID so the UI can prompt the user to update the Smart Contract.
     */
    async saveIdentity(data: IdentityData): Promise<string> {
        data.lastUpdated = Date.now();
        const cid = await IpfsService.upload(data);
        return cid;
    }

    /**
     * MOCK: Simulates updating the smart contract.
     * In a real app, this would be a validation check before sending a transaction.
     */
    async mockUpdateContract(address: string, cid: string): Promise<void> {
        const lowerAddress = address.toLowerCase();
        localStorage.setItem(`contract_identity_${lowerAddress}`, cid);
        this.knownCids.set(lowerAddress, cid);
        console.log(`[IdentityService] Contract updated for ${address} -> ${cid}`);
    }
}

export const identityService = new IdentityService();
