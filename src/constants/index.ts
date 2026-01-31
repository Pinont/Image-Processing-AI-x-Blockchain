// Constants for the application
export const STORAGE_KEYS = {
  USER_DATA: 'user_data',
  CHAT_HISTORY: 'chat_history',
  WALLET_ADDRESS: 'wallet_address',
  APP_CONFIG: 'app_config'
} as const;

export const DEFAULT_USER = {
  tokenBalance: 1000,
  coinBalance: 500
};

export const API_ENDPOINTS = {
  YOLO_DETECT: 'http://localhost:8000/detect',
  IPFS_UPLOAD: '/api/ipfs/upload'
} as const;

export const FILE_CONSTRAINTS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'] as string[],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp']
} as const;

export const ANIMATION_CONFIG = {
  PARTICLE_COUNT: 50,
  PARTICLE_SPEED: 2,
  PARTICLE_COLORS: ['#ffffff', '#888888', '#60a5fa']
} as const;

export const CHAT_CONFIG = {
  MAX_MESSAGES: 100,
  MAX_CHATS: 10,
  AUTO_SAVE_INTERVAL: 5000 // 5 seconds
} as const;

export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds 10MB limit',
  INVALID_FILE_TYPE: 'Only JPG, PNG, and WebP images are allowed',
  UPLOAD_FAILED: 'Failed to upload image',
  DETECTION_FAILED: 'Failed to detect objects',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  WALLET_NOT_CONNECTED: 'Wallet not connected',
  NETWORK_ERROR: 'Network error occurred'
} as const;

export const SUCCESS_MESSAGES = {
  UPLOAD_SUCCESS: 'Image uploaded successfully',
  DETECTION_SUCCESS: 'Objects detected successfully',
  WALLET_CONNECTED: 'Wallet connected successfully'
} as const;
