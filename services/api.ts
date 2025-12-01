import { Poll, ApiResponse, QRToken } from '../types';
import { db } from './mockDb';
import config from './config';

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
    const res = await fetch(url, init);
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
  // Polls
  getPolls: async (): Promise<ApiResponse<Poll[]>> => {
    if (config.getUseMock()) {
      const polls = db.getPolls();
      return simulateNetwork({ success: true, data: polls });
    }
    return remoteFetch<Poll[]>('/api/polls');
  },

  getPoll: async (id: string): Promise<ApiResponse<Poll>> => {
    if (config.getUseMock()) {
      const poll = db.getPollById(id);
      if (!poll) return simulateNetwork({ success: false, error: '活动未找到' });
      return simulateNetwork({ success: true, data: poll });
    }
    return remoteFetch<Poll>(`/api/polls/${encodeURIComponent(id)}`);
  },

  createPoll: async (title: string, options: string[]): Promise<ApiResponse<Poll>> => {
    if (config.getUseMock()) {
      const newPoll: Poll = {
        id: Date.now().toString(),
        title,
        options: options.map((text, i) => ({ id: `opt_${Date.now()}_${i}`, text, count: 0 })),
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
  vote: async (pollId: string, optionId: string, tokenStr: string): Promise<ApiResponse<boolean>> => {
    if (config.getUseMock()) {
      const success = db.castVote(pollId, optionId, tokenStr);
      if (!success) {
        return simulateNetwork({ success: false, error: '投票失败：令牌无效或已使用' });
      }
      return simulateNetwork({ success: true, data: true });
    }

    return remoteFetch<boolean>(`/api/polls/${encodeURIComponent(pollId)}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId, token: tokenStr }),
    });
  },

  // WeChat Mini Program QR Code
  generateWechatQRCode: async (pollId: string, currentToken: string): Promise<ApiResponse<{qr_image: string, poll_id: string, token: string}>> => {
    if (config.getUseMock()) {
      // Mock implementation
      return simulateNetwork({ 
        success: true, 
        data: {
          qr_image: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`pages/vote/index?pollId=${pollId}&token=${currentToken}`)}`,
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
};

export default api;
