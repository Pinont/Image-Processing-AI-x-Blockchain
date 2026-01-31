// Central type definitions for the application

export interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  processing?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  lastUpdate: Date;
}

export interface Detection {
  class: string;
  confidence: number;
  box: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

export interface DetectionResult {
  detections: Detection[];
  annotated_image: string; // Base64 image with boxes already drawn
}

export interface User {
  tokenBalance: number;
  coinBalance: number;
}

export interface WalletState {
  account: string | null;
  isConnecting: boolean;
  error: string | null;
}

export interface UsageCost {
  prompt: number;
  generation: number;
}

export interface AppConfig {
  usage_cost: UsageCost;
}

export interface ImageFile {
  file: File;
  preview: string;
  metadata?: {
    name: string;
    size: number;
    type: string;
  };
}

export interface IPFSUploadResult {
  hash: string;
  url: string;
  gateway: string;
}

export interface YOLOApiResponse {
  success: boolean;
  data?: DetectionResult;
  error?: string;
}

export interface StorageData {
  user?: User;
  chats?: Record<string, Chat>;
  lastSync?: number;
}

export interface AnimationConfig {
  particleCount?: number;
  speed?: number;
  colors?: string[];
}

// Enums
export enum BalanceType {
  TOKEN = 'token',
  COIN = 'coin'
}

export enum TransactionType {
  PROMPT = 'prompt',
  GENERATION = 'generation',
  UPLOAD = 'upload'
}

export enum StorageKey {
  USER_DATA = 'user_data',
  CHAT_HISTORY = 'chat_history',
  WALLET_ADDRESS = 'wallet_address',
  CONFIG = 'app_config'
}
