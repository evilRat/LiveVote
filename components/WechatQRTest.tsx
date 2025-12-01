import React, { useState } from 'react';
import { api } from '../services/api';

interface WechatQRData {
  qr_image: string;
  poll_id: string;
  token: string;
}

export const WechatQRTest: React.FC = () => {
  const [pollId, setPollId] = useState('');
  const [qrData, setQrData] = useState<WechatQRData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!pollId) {
      setError('请输入Poll ID');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // 为测试目的生成一个临时token
      const tempToken = 'test_token_' + Date.now();
      const res = await api.generateWechatQRCode(pollId, tempToken);
      if (res.success && res.data) {
        setQrData(res.data);
      } else {
        setError(res.error || '生成失败');
      }
    } catch (err) {
      setError('请求失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">微信小程序二维码测试</h1>
        
        <div className="bg-slate-800 rounded-xl p-6 mb-8">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={pollId}
              onChange={(e) => setPollId(e.target.value)}
              placeholder="输入 Poll ID"
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? '生成中...' : '生成二维码'}
            </button>
          </div>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
              {error}
            </div>
          )}
        </div>

        {qrData && (
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6">生成的二维码</h2>
            
            <div className="flex flex-col items-center">
              <div className="relative group mb-6">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative bg-white p-4 rounded-xl shadow-2xl">
                  <img 
                    src={qrData.qr_image} 
                    alt="微信小程序二维码" 
                    className="w-64 h-64 object-contain"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Poll ID</p>
                  <p className="font-mono text-sm break-all">{qrData.poll_id}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Token</p>
                  <p className="font-mono text-sm break-all">{qrData.token}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">小程序页面</p>
                  <p className="font-mono text-sm break-all">pages/vote/index</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};