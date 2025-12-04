export const STORAGE_KEYS = {
  AUTH_TOKEN: 'livevote_auth_token',
  USER_INFO: 'livevote_user_info',
};

export const storageService = {
  // Token management
  saveToken: (token: string): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (e) {
      console.error('Failed to save auth token', e);
    }
  },

  getToken: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (e) {
      console.error('Failed to get auth token', e);
      return null;
    }
  },

  removeToken: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (e) {
      console.error('Failed to remove auth token', e);
    }
  },

  // User info management
  saveUser: (user: any): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user info', e);
    }
  },

  getUser: (): any | null => {
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (e) {
      console.error('Failed to get user info', e);
      return null;
    }
  },

  removeUser: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    } catch (e) {
      console.error('Failed to remove user info', e);
    }
  },

  // Auth state management
  isLoggedIn: (): boolean => {
    return !!storageService.getToken();
  },

  logout: (): void => {
    storageService.removeToken();
    storageService.removeUser();
  },
};
