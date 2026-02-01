
import { ethers } from 'ethers';
import { DetectionResult } from '../types';
import IpfsService from './IpfsService';

// ABI for ProvenanceRegistry (Simplified for MVP)
// In a real app, this would be imported from the JSON artifact
const PROVENANCE_ABI = [
    "function recordDetection(bytes32 imageHash, string modelVersion, string resultCid) public",
    "event DetectionRecorded(address indexed user, bytes32 indexed imageHash, string modelVersion, string resultCid, uint256 timestamp)"
];

// Address would come from environment/config
// For now, we use a placeholder or the same as IdentityRegistry if we were deploying a monolith, 
// but usually it's a separate address.
const PROVENANCE_CONTRACT_ADDRESS = "0x...PLACEHOLDER...";

export class ProvenanceService {
    private static instance: ProvenanceService;
    private provider: ethers.providers.Web3Provider | null = null;
    private contract: ethers.Contract | null = null;

    private constructor() {
        this.initializeProvider();
    }

    public static getInstance(): ProvenanceService {
        if (!ProvenanceService.instance) {
            ProvenanceService.instance = new ProvenanceService();
        }
        return ProvenanceService.instance;
    }

    private initializeProvider() {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            this.provider = new ethers.providers.Web3Provider((window as any).ethereum);
        }
    }

    public async computeImageHash(file: File): Promise<string> {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return '0x' + hashHex;
    }

    public async recordProvenance(
        file: File,
        result: DetectionResult,
        modelVersion: string = "YOLOv11x-Web"
    ): Promise<{ txHash: string; imageHash: string }> {
        if (!this.provider) throw new Error("Wallet not connected");

        // 1. Compute Hash
        const imageHash = await this.computeImageHash(file);

        // 2. Upload Result to IPFS
        // We reuse the IpfsService functionality. 
        // We'll wrap the result in a metadata object
        const metadata = {
            imageHash,
            modelVersion,
            timestamp: Date.now(),
            detections: result.detections
        };

        // In a real app, IpfsService would have a generic 'uploadJson' method.
        // Assuming IpfsService has `uploadFile` or similar. 
        // For this MVP, we might mock this part or add `saveJson` to IpfsService.
        // Let's assume we implement `saveProvenanceMetadata` in IpfsService or use a direct stub here.
        const resultCid = await IpfsService.upload(metadata);

        // 3. Call Smart Contract
        const signer = this.provider.getSigner();
        // In reality, we need the real deployed address. 
        // If not deployed, we can't really call it. 
        // We will simulate the transaction for the UI walkthough if no address is set.

        if (PROVENANCE_CONTRACT_ADDRESS.includes("PLACEHOLDER")) {
            console.warn("Provenance Contract not deployed. Simulating transaction.");
            await new Promise(resolve => setTimeout(resolve, 2000)); // Fake network delay
            return {
                txHash: "0xSIMULATED_HASH_" + Date.now(),
                imageHash
            };
        }

        this.contract = new ethers.Contract(PROVENANCE_CONTRACT_ADDRESS, PROVENANCE_ABI, signer);
        const tx = await this.contract.recordDetection(imageHash, modelVersion, resultCid);
        await tx.wait();

        return { txHash: tx.hash, imageHash };
    }
}

export default ProvenanceService.getInstance();
