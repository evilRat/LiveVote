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
  createdBy: string;
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

// User types
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// API Response Wrappers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
