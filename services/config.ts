export const CONFIG_KEYS = {
  USE_MOCK: 'livevote_useMock',
  API_BASE: 'livevote_apiBase',
  SHOW_QR_URL: 'livevote_showQrUrl',
  SHOW_SIMULATE_VOTE: 'livevote_showSimulateVote', // 新增模拟投票开关配置键
  USE_MINI_PROGRAM_QR: 'livevote_useMiniProgramQR', // 新增使用小程序二维码开关配置键
};

export const DEFAULT_API_BASE = 'https://zyz.qdcto.com';
// export const DEFAULT_API_BASE = 'http://127.0.0.1:8000';

export const config = {
  getUseMock: (): boolean => {
    try {
      const v = localStorage.getItem(CONFIG_KEYS.USE_MOCK);
      if (v === null) return false; // default to mock off
      return v === 'true';
    } catch (e) {
      return false;
    }
  },

  setUseMock: (val: boolean) => {
    try {
      localStorage.setItem(CONFIG_KEYS.USE_MOCK, val ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to save config', e);
    }
  },

  getApiBase: (): string => {
    try {
      const v = localStorage.getItem(CONFIG_KEYS.API_BASE);
      return v && v.length > 0 ? v : DEFAULT_API_BASE;
    } catch (e) {
      return DEFAULT_API_BASE;
    }
  },

  setApiBase: (url: string) => {
    try {
      localStorage.setItem(CONFIG_KEYS.API_BASE, url);
    } catch (e) {
      console.error('Failed to save api base', e);
    }
  },

  makeUrl: (path: string) => {
    const base = config.getApiBase().replace(/\/+$/, '');
    const p = path.replace(/^\/+/, '');
    return `${base}/${p}`;
  },

  getShowQrUrl: (): boolean => {
    try {
      const v = localStorage.getItem(CONFIG_KEYS.SHOW_QR_URL);
      if (v === null) return false; // default to hidden
      return v === 'true';
    } catch (e) {
      return false;
    }
  },

  setShowQrUrl: (val: boolean) => {
    try {
      localStorage.setItem(CONFIG_KEYS.SHOW_QR_URL, val ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to save config', e);
    }
  },
  
  // 新增模拟投票开关的getter和setter
  getShowSimulateVote: (): boolean => {
    try {
      const v = localStorage.getItem(CONFIG_KEYS.SHOW_SIMULATE_VOTE);
      if (v === null) return false; // default to hidden
      return v === 'true';
    } catch (e) {
      return false;
    }
  },

  setShowSimulateVote: (val: boolean) => {
    try {
      localStorage.setItem(CONFIG_KEYS.SHOW_SIMULATE_VOTE, val ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to save config', e);
    }
  },

  // 新增使用小程序二维码开关的getter和setter
  getUseMiniProgramQR: (): boolean => {
    try {
      const v = localStorage.getItem(CONFIG_KEYS.USE_MINI_PROGRAM_QR);
      if (v === null) return true; // default to true (使用小程序二维码)
      return v === 'true';
    } catch (e) {
      return true;
    }
  },

  setUseMiniProgramQR: (val: boolean) => {
    try {
      localStorage.setItem(CONFIG_KEYS.USE_MINI_PROGRAM_QR, val ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to save config', e);
    }
  }
};