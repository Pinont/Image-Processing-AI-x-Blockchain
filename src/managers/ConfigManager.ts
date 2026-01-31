import { AppConfig, UsageCost } from '../types';

/**
 * ConfigManager - Singleton class for managing application configuration
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig | null = null;
  private isLoaded: boolean = false;

  private constructor() {}

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Load configuration from environment or defaults
   */
  public async loadConfig(): Promise<AppConfig> {
    if (this.isLoaded && this.config) {
      return this.config;
    }

    try {
      // Load from environment variables (Vite style)
      const config: AppConfig = {
        usage_cost: {
          prompt: Number(import.meta.env.VITE_COST_PROMPT) || 0.1,
          generation: Number(import.meta.env.VITE_COST_GENERATION) || 0.5
        }
      };

      this.config = config;
      this.isLoaded = true;
      return config;
    } catch (error) {
      console.error('Failed to load config, using defaults:', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): AppConfig {
    const defaultConfig: AppConfig = {
      usage_cost: {
        prompt: 0.1,
        generation: 0.5
      }
    };
    this.config = defaultConfig;
    this.isLoaded = true;
    return defaultConfig;
  }

  /**
   * Get configuration synchronously (must call loadConfig first)
   */
  public getConfig(): AppConfig {
    if (!this.config) {
      return this.getDefaultConfig();
    }
    return this.config;
  }

  /**
   * Get usage costs
   */
  public getUsageCost(): UsageCost {
    return this.getConfig().usage_cost;
  }

  /**
   * Get prompt cost
   */
  public getPromptCost(): number {
    return this.getConfig().usage_cost.prompt;
  }

  /**
   * Get generation cost
   */
  public getGenerationCost(): number {
    return this.getConfig().usage_cost.generation;
  }

  /**
   * Update configuration at runtime
   */
  public updateConfig(partial: Partial<AppConfig>): void {
    if (this.config) {
      this.config = { ...this.config, ...partial };
    }
  }

  /**
   * Update usage costs
   */
  public updateUsageCost(cost: Partial<UsageCost>): void {
    if (this.config) {
      this.config.usage_cost = { ...this.config.usage_cost, ...cost };
    }
  }

  /**
   * Validate configuration
   */
  public validate(): boolean {
    if (!this.config) return false;

    const { usage_cost } = this.config;
    if (!usage_cost) return false;
    if (typeof usage_cost.prompt !== 'number' || usage_cost.prompt < 0) return false;
    if (typeof usage_cost.generation !== 'number' || usage_cost.generation < 0) return false;

    return true;
  }

  /**
   * Reset configuration to defaults
   */
  public reset(): void {
    this.config = null;
    this.isLoaded = false;
    this.getDefaultConfig();
  }

  /**
   * Check if config is loaded
   */
  public isConfigLoaded(): boolean {
    return this.isLoaded;
  }
}

export default ConfigManager.getInstance();
