import React, { useState } from 'react';
import { Button } from './Button';
import { api } from '../services/api';
import { storageService } from '../services/storageService';
import { Lock, Mail, User, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await api.login({
          username: formData.username,
          password: formData.password,
        });

        if (response.success && response.data) {
          storageService.saveToken(response.data.access_token);
          storageService.saveUser(response.data.user);
          onLoginSuccess();
        } else {
          setError(response.error || '登录失败');
        }
      } else {
        // Register
        const response = await api.register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });

        if (response.success && response.data) {
          // After successful registration, switch to login
          setIsLogin(true);
          setFormData(prev => ({ ...prev, password: '' }));
          setError(null);
        } else {
          setError(response.error || '注册失败');
        }
      }
    } catch (e: any) {
      console.error('Authentication error', e);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const toggleFormMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setFormData({
      username: '',
      email: '',
      password: '',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? '欢迎回来' : '创建账号'}
            </h1>
            <p className="text-gray-600">
              {isLogin ? '登录后管理您的投票活动' : '注册一个新账号'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-900 mb-1">
                  用户名
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="请输入用户名"
                    disabled={loading}
                  />
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
                    邮箱
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      className="block w-full pl-10 pr-3 py-2 border text-gray-900 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="请输入邮箱"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1">
                  密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    className="block w-full pl-10 pr-10 py-2 border text-gray-900 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="请输入密码"
                    disabled={loading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                {isLogin ? '登录' : '注册'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? '还没有账号？' : '已有账号？'}
              <button
                onClick={toggleFormMode}
                className="font-medium text-indigo-600 hover:text-indigo-500 ml-1"
                disabled={loading}
              >
                {isLogin ? '立即注册' : '立即登录'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
