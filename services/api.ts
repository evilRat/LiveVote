import { Poll, ApiResponse, QRToken } from '../types';
import { db } from './mockDb';

// Helper to simulate network latency (100ms - 500ms)
const simulateNetwork = <T>(data: T): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, Math.random() * 400 + 100);
  });
};

export const api = {
  // Polls
  getPolls: async (): Promise<ApiResponse<Poll[]>> => {
    const polls = db.getPolls();
    return simulateNetwork({ success: true, data: polls });
  },

  getPoll: async (id: string): Promise<ApiResponse<Poll>> => {
    const poll = db.getPollById(id);
    if (!poll) {
      return simulateNetwork({ success: false, error: '活动未找到' });
    }
    return simulateNetwork({ success: true, data: poll });
  },

  createPoll: async (title: string, options: string[]): Promise<ApiResponse<Poll>> => {
    const newPoll: Poll = {
      id: Date.now().toString(),
      title,
      options: options.map((text, i) => ({
        id: `opt_${Date.now()}_${i}`,
        text,
        count: 0
      })),
      createdAt: Date.now(),
      isActive: true
    };
    db.createPoll(newPoll);
    return simulateNetwork({ success: true, data: newPoll });
  },

  // Tokens (QR Code)
  generateToken: async (pollId: string): Promise<ApiResponse<string>> => {
    const token = db.createToken(pollId);
    return simulateNetwork({ success: true, data: token });
  },

  checkTokenStatus: async (tokenStr: string): Promise<ApiResponse<QRToken>> => {
    const token = db.getToken(tokenStr);
    if (!token) return simulateNetwork({ success: false, error: 'Token invalid' });
    return simulateNetwork({ success: true, data: token });
  },

  markTokenScanned: async (tokenStr: string): Promise<ApiResponse<boolean>> => {
    const success = db.updateTokenStatus(tokenStr, 'scanned');
    return simulateNetwork({ success: true, data: success });
  },

  // Voting
  vote: async (pollId: string, optionId: string, tokenStr: string): Promise<ApiResponse<boolean>> => {
    const success = db.castVote(pollId, optionId, tokenStr);
    if (!success) {
      return simulateNetwork({ success: false, error: '投票失败：令牌无效或已使用' });
    }
    return simulateNetwork({ success: true, data: true });
  }
};
