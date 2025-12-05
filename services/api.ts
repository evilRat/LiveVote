import { Poll, ApiResponse, QRToken, LoginRequest, RegisterRequest, LoginResponse, User } from '../types';
import { db } from './mockDb';
import { config } from './config';
import { storageService } from './storageService';

// Helper to simulate network latency (100ms - 500ms)
const simulateNetwork = <T>(data: T): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, Math.random() * 400 + 100);
  });
};

const remoteFetch = async <T = any>(path: string, init?: RequestInit): Promise<ApiResponse<T>> => {
  try {
    const url = config.makeUrl(path);
    const token = storageService.getToken();
    
    // Create headers with token if available
    const headers = {
      ...(init?.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    
    const res = await fetch(url, {
      ...init,
      headers
    });
    
    // Handle 401 (Unauthorized) - clear token and redirect to login
    if (res.status === 401) {
      storageService.logout();
      window.location.hash = '/login';
    }
    
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      // Assume server returns { success: boolean, data?, error? }
      return json as ApiResponse<T>;
    }
    // fallback
    const text = await res.text();
    return { success: res.ok, data: (text as unknown) as T };
  } catch (e: any) {
    return { success: false, error: e?.message || String(e) };
  }
};

export const api = {
  // Authentication
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    if (config.getUseMock()) {
      // Mock login - always succeed for development
      const mockUser: User = {
        id: '123',
        username: credentials.username,
        email: `${credentials.username}@example.com`,
        createdAt: Date.now()
      };
      return simulateNetwork({
        success: true,
        data: {
          access_token: 'mock-token',
          token_type: 'bearer',
          user: mockUser
        }
      });
    }
    return remoteFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
  },

  register: async (userData: RegisterRequest): Promise<ApiResponse<User>> => {
    if (config.getUseMock()) {
      // Mock register
      const mockUser: User = {
        id: Date.now().toString(),
        username: userData.username,
        email: userData.email,
        createdAt: Date.now()
      };
      return simulateNetwork({ success: true, data: mockUser });
    }
    return remoteFetch<User>('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
  },

  // Polls
  getPolls: async (): Promise<ApiResponse<Poll[]>> => {
    if (config.getUseMock()) {
      const polls = db.getPolls();
      return simulateNetwork({ success: true, data: polls });
    }
    return remoteFetch<Poll[]>('/api/polls');
  },

  getPoll: async (id: string, last_total_votes?: number): Promise<ApiResponse<Poll>> => {
    if (config.getUseMock()) {
      const poll = db.getPoll(id);
      if (!poll) return simulateNetwork({ success: false, error: 'Poll not found' });
      return simulateNetwork({ success: true, data: poll });
    }
    // 添加长轮询参数到URL
    const url = last_total_votes !== undefined ? 
      `/api/polls/${encodeURIComponent(id)}?last_total_votes=${last_total_votes}` : 
      `/api/polls/${encodeURIComponent(id)}`;
    return remoteFetch<Poll>(url);
  },

  createPoll: async (title: string, options: string[]): Promise<ApiResponse<Poll>> => {
    if (config.getUseMock()) {
      const newPoll: Poll = {
        id: Date.now().toString(),
        title,
        options: options.map((text, i) => ({ id: `opt_${Date.now()}_${i}`, text, count: 0 })), // mock 模式下仍需包含 count 字段
        createdAt: Date.now(),
        isActive: true,
      };
      db.createPoll(newPoll);
      return simulateNetwork({ success: true, data: newPoll });
    }

    return remoteFetch<Poll>('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, options }),
    });
  },

  // Tokens (QR Code)
  generateToken: async (pollId: string): Promise<ApiResponse<string>> => {
    if (config.getUseMock()) {
      const token = db.createToken(pollId);
      return simulateNetwork({ success: true, data: token });
    }
    return remoteFetch<string>(`/api/polls/${encodeURIComponent(pollId)}/tokens`, { method: 'POST' });
  },

  checkTokenStatus: async (tokenStr: string): Promise<ApiResponse<QRToken>> => {
    if (config.getUseMock()) {
      const token = db.getToken(tokenStr);
      if (!token) return simulateNetwork({ success: false, error: 'Token invalid' });
      return simulateNetwork({ success: true, data: token });
    }
    return remoteFetch<QRToken>(`/api/tokens/${encodeURIComponent(tokenStr)}`);
  },

  markTokenScanned: async (tokenStr: string): Promise<ApiResponse<boolean>> => {
    if (config.getUseMock()) {
      const success = db.updateTokenStatus(tokenStr, 'scanned');
      return simulateNetwork({ success: true, data: success });
    }
    return remoteFetch<boolean>(`/api/tokens/${encodeURIComponent(tokenStr)}/scanned`, { method: 'POST' });
  },

  // Voting
  vote: async (pollId: string, optionId: string, tokenStr: string, openId?: string): Promise<ApiResponse<boolean>> => {
    if (config.getUseMock()) {
      const success = db.castVote(pollId, optionId, tokenStr);
      if (!success) {
        return simulateNetwork({ success: false, error: '投票失败：令牌无效或已使用' });
      }
      return simulateNetwork({ success: true, data: true });
    }

    // Prepare request data
    const requestData: any = { optionId, token: tokenStr };
    if (openId) {
      requestData.openId = openId;
    }

    return remoteFetch<boolean>(`/api/polls/${encodeURIComponent(pollId)}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });
  },

  // WeChat Mini Program QR Code
  generateWechatQRCode: async (pollId: string, currentToken: string): Promise<ApiResponse<{qr_image: string, poll_id: string, token: string}>> => {
    if (config.getUseMock()) {
      // Mock implementation - 使用scene参数格式以匹配getwxacodeunlimit接口
      const scene = `pollId=${pollId}&token=${currentToken}`;
      return simulateNetwork({ 
        success: true, 
        data: {
          qr_image: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`pages/vote/index?scene=${encodeURIComponent(scene)}`)}`,
          poll_id: pollId,
          token: currentToken
        } 
      });
    }
    return remoteFetch<{qr_image: string, poll_id: string, token: string}>(`/api/polls/${encodeURIComponent(pollId)}/${encodeURIComponent(currentToken)}/wechat-qr`, { method: 'POST' });
  },

  deletePoll: async (pollId: string): Promise<ApiResponse<boolean>> => {
    if (config.getUseMock()) {
      const success = db.deletePoll(pollId as string);
      if (!success) {
        return simulateNetwork({ success: false, error: '删除失败' });
      }
      return simulateNetwork({ success: true, data: true });
    }

    return remoteFetch<boolean>(`/api/polls/${encodeURIComponent(pollId)}`, { method: 'DELETE' });
  },

  // WeChat Mini Program Access Token Refresh
  refreshWechatAccessToken: async (): Promise<ApiResponse<{ access_token: string }>> => {
    if (config.getUseMock()) {
      // Mock implementation
      return simulateNetwork({ 
        success: true, 
        data: { access_token: 'mock-access-token-refreshed' } 
      });
    }
    return remoteFetch<{ access_token: string }>('/api/refresh-wechat-token', { method: 'POST' });
  },

};

export default api;
