// Service to handle IPFS interactions.
// Currently uses a Mock implementation to simulate IPFS behavior.

export interface IIpfsService {
  upload(data: object): Promise<string>;
  fetch<T>(cid: string): Promise<T>;
}

class MockIpfsService implements IIpfsService {
  private storage: Map<string, object> = new Map();

  // Simulate an upload to IPFS.
  // Returns a pseudo-CID.
  async upload(data: object): Promise<string> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create a mock CID (simple hash of data content for simulation)
    const contentString = JSON.stringify(data);
    const cid = `Qm${this.simpleHash(contentString)}`;
    
    // Store in memory (and persistent storage for demo continuity)
    this.storage.set(cid, data);
    localStorage.setItem(`mock_ipfs_${cid}`, contentString);

    console.log(`[MockIPFS] Uploaded data. CID: ${cid}`);
    return cid;
  }

  // Simulate fetching from IPFS.
  async fetch<T>(cid: string): Promise<T> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Try memory first
    if (this.storage.has(cid)) {
        console.log(`[MockIPFS] Fetched data from Memory. CID: ${cid}`);
        return this.storage.get(cid) as T;
    }

    // Try LocalStorage (persistent mock)
    const stored = localStorage.getItem(`mock_ipfs_${cid}`);
    if (stored) {
        console.log(`[MockIPFS] Fetched data from LocalStorage. CID: ${cid}`);
        const data = JSON.parse(stored);
        this.storage.set(cid, data);
        return data as T;
    }

    throw new Error(`[MockIPFS] Content not found for CID: ${cid}`);
  }

  // Simple string hash function for generating mock CIDs
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padEnd(46, 'x'); // Padding to look like a CID
  }
}

export const IpfsService = new MockIpfsService();
