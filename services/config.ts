export const CONFIG_KEYS = {
  USE_MOCK: 'false',
  API_BASE: 'localhost:8000',
};

export const config = {
  getUseMock: (): boolean => {
    try {
      const v = localStorage.getItem(CONFIG_KEYS.USE_MOCK);
      if (v === null) return true; // default to mock on
      return v === 'true';
    } catch (e) {
      return true;
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
      return v && v.length > 0 ? v : 'http://localhost:8000';
    } catch (e) {
      return 'http://localhost:8000';
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
