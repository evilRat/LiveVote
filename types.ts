export interface PollOption {
  id: string;
  text: string;
}

// 用于表示后端返回的带有票数的选项
export interface PollOptionWithCount extends PollOption {
  count: number;
}

export interface Poll {
  id: string;
  title: string;
  options: PollOptionWithCount[];
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
