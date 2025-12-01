export interface PollOption {
  id: string;
  text: string;
  count: number;
}

export interface Poll {
  id: string;
  title: string;
  options: PollOption[];
  createdAt: number;
  isActive: boolean;
}

export interface VoteRecord {
  pollId: string;
  optionId: string;
  timestamp: number;
}

export type TokenStatus = 'active' | 'scanned' | 'used';

export interface QRToken {
  token: string;
  pollId: string;
  status: TokenStatus;
  createdAt: number;
}

export interface Route {
  path: 'list' | 'create' | 'display' | 'vote' | 'wechat-qr-test';
  params: Record<string, string>;
}

// API Response Wrappers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
