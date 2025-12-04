import React, { useEffect, useState } from 'react';
import { Poll, PollOptionWithCount } from '../types';
import { api } from '../services/api';
import { config } from '../services/config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Smartphone, Trophy, Users, ArrowLeft, AlertTriangle, Sun, Moon } from 'lucide-react';
import { Button } from './Button';

interface PollDisplayProps {
  pollId: string;
  onBack: () => void;
}

const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444'];

export const PollDisplay: React.FC<PollDisplayProps> = ({ pollId, onBack }) => {
  const [poll, setPoll] = useState<Poll | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [currentToken, setCurrentToken] = useState<string>('');
  const [results, setResults] = useState<{ name: string; votes: number; fill: string }[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [simLoading, setSimLoading] = useState(false);
  const [simMessage, setSimMessage] = useState<string | null>(null);
  const [wechatQRCode, setWechatQRCode] = useState<string>(''); // 微信二维码图片数据
  const [wechatQRData, setWechatQRData] = useState<{poll_id: string, token: string} | null>(null); // 微信二维码数据
  const [loadingWechatQR, setLoadingWechatQR] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark'); // 主题状态

  // 1. Data Fetching (Results)
  useEffect(() => {
    let isMounted = true;
    
    const fetchPollData = async () => {
      try {
        const response = await api.getPoll(pollId);
        if (!isMounted) return;

        if (response.success && response.data) {
          const p = response.data;
          setPoll(p);
          
          const res = p.options.map((opt, index) => ({
            name: opt.text,
            votes: opt.count,  // 现在从后端获取的是实时计算的票数
            fill: COLORS[index % COLORS.length]
          }));
          
          setResults(res);
          setTotalVotes(p.options.reduce((acc, curr) => acc + curr.count, 0));
          setError(null);
        } else {
          // Only show error if we haven't successfully loaded data yet
          setPoll((prev) => {
            if (!prev) setError(response.error || '无法加载活动数据');
            return prev;
          });
        }
      } catch (err) {
        if (isMounted) {
          setPoll((prev) => {
            if (!prev) setError('网络连接异常');
            return prev;
          });
        }
      }
    };

    fetchPollData();
    // Short polling for "real-time" feeling
    const interval = setInterval(fetchPollData, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pollId]);

  // 2. Token Management (QR Code Rotation)
  useEffect(() => {
    // Don't generate tokens if there is a main error
    if (error || !pollId) return;

    let isMounted = true;
    let checkInterval: number;

    const initToken = async () => {
      try {
        const res = await api.generateToken(pollId);
        if (isMounted && res.success && res.data) {
          setCurrentToken(res.data);
        }
      } catch (e) {
        console.error("Token generation failed", e);
      }
    };

    const checkTokenStatus = async () => {
      if (!currentToken) return;
      try {
        const res = await api.checkTokenStatus(currentToken);
        
        if (isMounted && res.success && res.data) {
          const status = res.data.status;
          if (status === 'scanned' || status === 'used') {
            // Token consumed, generate new one immediately
            const newRes = await api.generateToken(pollId);
            if (newRes.success && newRes.data) {
              setCurrentToken(newRes.data);
            }
          }
        }
      } catch (e) {
        console.error("Token check failed", e);
      }
    };

    if (!currentToken) {
      initToken();
    } else {
      checkInterval = window.setInterval(checkTokenStatus, 1000);
    }

    return () => {
      isMounted = false;
      clearInterval(checkInterval);
    };
  }, [pollId, currentToken, error]);

  // 添加获取微信二维码的effect
  useEffect(() => {
    if (!pollId || !currentToken) return;
    
    let isMounted = true;
    
    const fetchWechatQRCode = async () => {
      setLoadingWechatQR(true);
      try {
        const res = await api.generateWechatQRCode(pollId, currentToken);
        if (isMounted && res.success && res.data) {
          setWechatQRCode(res.data.qr_image);
          setWechatQRData({
            poll_id: res.data.poll_id,
            token: res.data.token
          });
        }
      } catch (e) {
        console.error("获取微信二维码失败", e);
      } finally {
        if (isMounted) {
          setLoadingWechatQR(false);
        }
      }
    };
    
    fetchWechatQRCode();
    
    return () => {
      isMounted = false;
    };
  }, [pollId, currentToken]); // 添加currentToken作为依赖项
  
  // 主题切换 effect
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    }
  }, [theme]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6">
        <div className="bg-red-500/10 p-4 rounded-full mb-6 text-red-400">
           <AlertTriangle size={48} />
        </div>
        <h2 className="text-2xl font-bold mb-3">无法加载活动</h2>
        <p className="text-slate-400 mb-8 max-w-md text-center">{error}</p>
        <Button onClick={onBack} variant="secondary" icon={<ArrowLeft size={18}/>}>返回列表</Button>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mr-3"></div>
        正在加载活动数据...
      </div>
    );
  }

  const voteUrl = `${window.location.origin}${window.location.pathname}#/vote/${pollId}/${currentToken}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(voteUrl)}&bgcolor=ffffff&color=0f172a`;
  const wechatUrl = wechatQRData ? `pages/vote/index?pollId=${wechatQRData.poll_id}&token=${wechatQRData.token}` : '';

  // 修改模拟投票的逻辑，确保在投票后刷新微信二维码
  const handleSimulateVote = async () => {
    if (simLoading) return;
    setSimLoading(true);
    setSimMessage(null);
    try {
      if (!poll || !poll.options || poll.options.length === 0) {
        setSimMessage('没有可用选项');
        return;
      }

      const pick = poll.options[Math.floor(Math.random() * poll.options.length)];

      // Try to vote with current token first
      let res = await api.vote(pollId, pick.id, currentToken);

      // If vote failed (token used/invalid), try to generate a new token and retry once
      if (!res.success) {
        const gen = await api.generateToken(pollId);
        if (gen.success && gen.data) {
          setCurrentToken(gen.data);
          res = await api.vote(pollId, pick.id, gen.data);
        }
      }

      if (res.success) {
        setSimMessage(`已为 “${pick.text}” 随机投票`);
        // Refresh poll data
        const pRes = await api.getPoll(pollId);
        if (pRes.success && pRes.data) {
          const p = pRes.data;
          setPoll(p);
          const resArr = p.options.map((opt, index) => ({
            name: opt.text,
            votes: opt.count,  // 现在从后端获取的是实时计算的票数
            fill: COLORS[index % COLORS.length]
          }));
          setResults(resArr);
          setTotalVotes(p.options.reduce((acc, curr) => acc + curr.count, 0));
        }
      } else {
        setSimMessage(res.error || '模拟投票失败');
      }
    } catch (e) {
      console.error(e);
      setSimMessage('发生异常，投票未完成');
    } finally {
      setSimLoading(false);
      // clear message after a short delay
      setTimeout(() => setSimMessage(null), 2000);
    }
  };
  
  // 切换主题的函数
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'} p-6 flex flex-col`}>
      {/* Header */}
      <header className={`mb-8 flex justify-between items-center pb-4 ${theme === 'dark' ? 'border-b border-slate-700' : 'border-b border-gray-300'}`}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className={theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}>
            <ArrowLeft size={20} className="mr-2" />
            返回列表
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
              {poll.title}
            </h1>
            <p className={`mt-2 flex items-center gap-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
              <Users size={18} /> 实时投票进行中
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${theme === 'dark' ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <div className={`px-6 py-3 rounded-lg flex items-center gap-3 ${theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-300'}`}>
            <Trophy className={`${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'}`} />
            <div>
              <span className={`block text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>总票数</span>
              <span className="text-2xl font-mono font-bold">{totalVotes}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: QR Codes and Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* QR Codes Section */}
          <div className={`h-full rounded-2xl p-6 border shadow-xl backdrop-blur-sm flex flex-col ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-300'}`}>
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span className={`w-2 h-8 rounded-full ${theme === 'dark' ? 'bg-green-500' : 'bg-green-400'}`}></span>
              扫码投票
            </h3>
            
            <div className="grid flex-1 items-center">              
              {/* WeChat Mini Program QR Code */}
              <div className="flex flex-col items-center">
                {loadingWechatQR ? (
                  <div className="flex items-center justify-center w-44 h-44">
                    <div className={`animate-spin h-8 w-8 border-4 border-t-transparent rounded-full ${theme === 'dark' ? 'border-green-500' : 'border-green-400'}`}></div>
                  </div>
                ) : wechatQRCode ? (
                  <>
                    <div className="relative group mb-3">
                      <div className={`absolute -inset-1 rounded-xl blur opacity-25 transition duration-1000 ${theme === 'dark' ? 'bg-gradient-to-r from-green-500 to-teal-500 group-hover:opacity-50' : 'bg-gradient-to-r from-green-400 to-teal-400 group-hover:opacity-40'}`}></div>
                      <div className={`relative p-3 rounded-xl shadow-2xl ${theme === 'dark' ? 'bg-white' : 'bg-gray-100'}`}>
                        <img 
                          src={wechatQRCode} 
                          alt="微信小程序二维码" 
                          className="w-100 h-100 object-contain"
                        />
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${theme === 'dark' ? 'bg-green-500/10 text-green-300 border-green-500/20' : 'bg-green-100 text-green-800 border-green-200'}`}>
                        <Smartphone size={14} />
                        <span className="font-medium">微信扫码</span>
                      </div>
                      <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>使用微信扫描进入小程序</p>
                    </div>
                  </>
                ) : (
                  <div className={`flex flex-col items-center justify-center w-44 h-44 rounded-xl ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'}`}>
                    <span className={`text-sm mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>二维码加载失败</span>
                    <button 
                      onClick={() => {
                        // 重新加载微信二维码
                        if (pollId && currentToken) {
                          setLoadingWechatQR(true);
                          api.generateWechatQRCode(pollId, currentToken).then(res => {
                            if (res.success && res.data) {
                              setWechatQRCode(res.data.qr_image);
                            }
                            setLoadingWechatQR(false);
                          }).catch(() => {
                            setLoadingWechatQR(false);
                          });
                        }
                      }}
                      className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-slate-600 hover:bg-slate-500' : 'bg-gray-300 hover:bg-gray-400'}`}
                    >
                      重新加载
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* QR Code Instructions */}
            <div className={`mt-6 pt-4 ${theme === 'dark' ? 'border-t border-slate-700' : 'border-t border-gray-300'}`}>
              <p className={`text-sm text-center ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                二维码单次有效，扫码后自动刷新。
              </p>
            </div>
            
            {/* Simulate Vote Button - 根据配置决定是否显示 */}
            {config.getShowSimulateVote() && (
              <div className="flex flex-col items-center mt-6">
                <Button
                  variant="primary"
                  onClick={handleSimulateVote} // 使用新的处理函数
                  isLoading={simLoading}
                >
                  模拟投票
                </Button>

                {simMessage ? (
                  <div className={`mt-2 text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>{simMessage}</div>
                ) : null}
              </div>
            )}
          </div>
          
          {/* QR Code URLs Display - Only show when enabled */}
          {config.getShowQrUrl() && (
            <div className={`rounded-2xl p-6 border shadow-xl backdrop-blur-sm ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-300'}`}>
              <div className="space-y-4">
                <div>
                  <p className={`text-xs mb-2 uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>网页二维码链接</p>
                  <div className={`rounded-lg p-3 overflow-auto ${theme === 'dark' ? 'bg-slate-900/50 border border-slate-700' : 'bg-gray-100 border border-gray-300'}`}>
                    <code className={`text-xs break-all font-mono ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>{voteUrl}</code>
                  </div>
                </div>
                
                <div>
                  <p className={`text-xs mb-2 uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>小程序页面路径</p>
                  <div className={`rounded-lg p-3 overflow-auto ${theme === 'dark' ? 'bg-slate-900/50 border border-slate-700' : 'bg-gray-100 border border-gray-300'}`}>
                    <code className={`text-xs break-all font-mono ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>{wechatUrl}</code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className={`lg:col-span-8 rounded-2xl p-8 border shadow-xl backdrop-blur-sm flex flex-col ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-300'}`}>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className={`w-2 h-8 rounded-full ${theme === 'dark' ? 'bg-indigo-500' : 'bg-indigo-400'}`}></span>
            实时结果
          </h2>
          
          <div className="flex-1 w-full min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#334155' : '#cbd5e1'} />
                <XAxis type="number" stroke={theme === 'dark' ? '#94a3b8' : '#94a3b8'} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150} 
                  stroke={theme === 'dark' ? '#e2e8f0' : '#334155'} 
                  tick={{ fill: theme === 'dark' ? '#e2e8f0' : '#334155', fontSize: 14 }}
                />
                <Tooltip 
                  cursor={{ fill: theme === 'dark' ? '#334155' : '#e2e8f0', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc', borderColor: theme === 'dark' ? '#475569' : '#cbd5e1', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                  itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                />
                <Bar dataKey="votes" radius={[0, 4, 4, 0]} animationDuration={500}>
                  <LabelList dataKey="votes" position="right" fill={theme === 'dark' ? '#e2e8f0' : '#334155'} />
                  {results.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );

};