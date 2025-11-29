export const CONFIG_KEYS = {
  USE_MOCK: 'livevote_useMock',
  API_BASE: 'livevote_apiBase',
};

export const DEFAULT_API_BASE = 'https://livevotebackend-production.up.railway.app';

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
  }
};

export default config;
