/**
 * Browser-compatible configuration
 * Uses environment variables instead of file system
 * For backwards compatibility with existing code
 */

interface UsageCost {
    prompt: number;
    generation: number;
}

// Load from environment variables (Vite style)
// Fallback to default values if not set
export const usage_cost: UsageCost = {
    prompt: Number(import.meta.env.VITE_COST_PROMPT) || 0.1,
    generation: Number(import.meta.env.VITE_COST_GENERATION) || 0.5
};

export default { usage_cost };