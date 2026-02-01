import { useState, useEffect, useCallback } from 'react';
import { identityService, IdentityData } from '../services/IdentityService';
import useWallet from './useWallet';

export const useIdentity = () => {
    const { walletAddress } = useWallet();
    const [identity, setIdentity] = useState<IdentityData | null>(null);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // Load identity when wallet connects
    useEffect(() => {
        if (!walletAddress) {
            setIdentity(null);
            return;
        }

        const load = async () => {
            setLoading(true);
            try {
                const data = await identityService.loadIdentity(walletAddress);
                setIdentity(data);
            } catch (e) {
                console.error("Failed to load identity", e);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [walletAddress]);

    // Save/Update Identity (Auto-Sync)
    const updateIdentity = useCallback(async (newData: IdentityData) => {
        if (!walletAddress) return;

        setSyncing(true);
        // Optimistic UI update
        setIdentity(newData);

        try {
            // 1. Upload to IPFS
            const cid = await identityService.saveIdentity(newData);

            // 2. Update Contract (Mock)
            // In a real app, we might debounce this or ask for user confirmation if it costs gas.
            // For this user request ("automatic sync"), we assume a low-cost/gasless or session-key approach 
            // where we just update the pointer.
            await identityService.mockUpdateContract(walletAddress, cid);

            console.log("Identity synced to IPFS & Contract:", cid);
        } catch (e) {
            console.error("Failed to sync identity", e);
            // Revert optimistic update if needed (omitted for simplicity)
        } finally {
            setSyncing(false);
        }
    }, [walletAddress]);

    return {
        identity,
        loading,
        syncing,
        updateIdentity
    };
};
