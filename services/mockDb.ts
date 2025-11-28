import { Poll, QRToken, VoteRecord } from '../types';

const KEYS = {
  POLLS: 'livevote_polls',
  TOKENS: 'livevote_tokens',
  VOTES: 'livevote_votes',
};

// --- Low Level DB Helpers ---

const getFromStore = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    return [];
  }
};

const saveToStore = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
  // Trigger storage event for cross-tab sync simulation
  window.dispatchEvent(new Event('storage'));
};

// --- Backend Business Logic Simulation ---

export const db = {
  getPolls: (): Poll[] => {
    return getFromStore<Poll>(KEYS.POLLS).sort((a, b) => b.createdAt - a.createdAt);
  },

  getPollById: (id: string): Poll | undefined => {
    return getFromStore<Poll>(KEYS.POLLS).find(p => p.id === id);
  },

  createPoll: (poll: Poll): Poll => {
    const polls = getFromStore<Poll>(KEYS.POLLS);
    polls.push(poll);
    saveToStore(KEYS.POLLS, polls);
    return poll;
  },

  createToken: (pollId: string): string => {
    const tokenStr = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const token: QRToken = {
      token: tokenStr,
      pollId,
      status: 'active',
      createdAt: Date.now(),
    };
    
    const tokens = getFromStore<QRToken>(KEYS.TOKENS);
    // Cleanup old tokens to keep storage clean
    const recentTokens = tokens.slice(-99); 
    recentTokens.push(token);
    saveToStore(KEYS.TOKENS, recentTokens);
    
    return tokenStr;
  },

  getToken: (tokenStr: string): QRToken | undefined => {
    return getFromStore<QRToken>(KEYS.TOKENS).find(t => t.token === tokenStr);
  },

  updateTokenStatus: (tokenStr: string, status: 'scanned' | 'used'): boolean => {
    const tokens = getFromStore<QRToken>(KEYS.TOKENS);
    const idx = tokens.findIndex(t => t.token === tokenStr);
    if (idx !== -1) {
      tokens[idx].status = status;
      saveToStore(KEYS.TOKENS, tokens);
      return true;
    }
    return false;
  },

  castVote: (pollId: string, optionId: string, tokenStr: string): boolean => {
    // Transactional simulation
    const tokens = getFromStore<QRToken>(KEYS.TOKENS);
    const tokenIdx = tokens.findIndex(t => t.token === tokenStr);
    
    if (tokenIdx === -1 || tokens[tokenIdx].status === 'used') {
      return false;
    }

    // 1. Update Token
    tokens[tokenIdx].status = 'used';
    saveToStore(KEYS.TOKENS, tokens);

    // 2. Record Vote
    const votes = getFromStore<VoteRecord>(KEYS.VOTES);
    votes.push({ pollId, optionId, timestamp: Date.now() });
    saveToStore(KEYS.VOTES, votes);

    // 3. Update Poll Count
    const polls = getFromStore<Poll>(KEYS.POLLS);
    const pollIdx = polls.findIndex(p => p.id === pollId);
    if (pollIdx !== -1) {
      const optIdx = polls[pollIdx].options.findIndex(o => o.id === optionId);
      if (optIdx !== -1) {
        polls[pollIdx].options[optIdx].count += 1;
        saveToStore(KEYS.POLLS, polls);
      }
    }

    return true;
  }

  ,

  deletePoll: (id: string): boolean => {
    try {
      const polls = getFromStore<Poll>(KEYS.POLLS);
      const filtered = polls.filter(p => p.id !== id);
      saveToStore(KEYS.POLLS, filtered);

      // Remove tokens associated with this poll
      const tokens = getFromStore(KEYS.TOKENS);
      const remainingTokens = tokens.filter((t: any) => t.pollId !== id);
      saveToStore(KEYS.TOKENS, remainingTokens as any[]);

      // Remove votes associated with this poll
      const votes = getFromStore(KEYS.VOTES);
      const remainingVotes = votes.filter((v: any) => v.pollId !== id);
      saveToStore(KEYS.VOTES, remainingVotes as any[]);

      return true;
    } catch (e) {
      console.error('Failed to delete poll', e);
      return false;
    }
  }
};