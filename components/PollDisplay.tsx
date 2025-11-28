import React, { useEffect, useState } from 'react';
import { Poll } from '../types';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Smartphone, Trophy, Users, ArrowLeft, AlertTriangle } from 'lucide-react';
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
            votes: opt.count,
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

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col">
      {/* Header */}
      <header className="mb-8 flex justify-between items-center border-b border-slate-700 pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="text-slate-400 hover:text-white hover:bg-slate-800">
            <ArrowLeft size={20} className="mr-2" />
            返回列表
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
              {poll.title}
            </h1>
            <p className="text-slate-400 mt-2 flex items-center gap-2">
              <Users size={18} /> 实时投票进行中
            </p>
          </div>
        </div>
        <div className="bg-slate-800 px-6 py-3 rounded-lg border border-slate-700 flex items-center gap-3">
          <Trophy className="text-yellow-400" />
          <div>
            <span className="block text-xs text-slate-400 uppercase tracking-wider">总票数</span>
            <span className="text-2xl font-mono font-bold">{totalVotes}</span>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: QR Code */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center bg-slate-800/50 rounded-2xl p-8 border border-slate-700 shadow-xl backdrop-blur-sm">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-white p-4 rounded-xl shadow-2xl">
              <img 
                src={qrUrl} 
                alt="扫码投票" 
                className="w-64 h-64 object-contain"
                key={currentToken} // Force re-render on token change
              />
            </div>
          </div>
          
          <div className="mt-8 text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-300 px-4 py-2 rounded-full border border-indigo-500/20 animate-pulse">
              <Smartphone size={20} />
              <span className="font-medium">扫码立即投票</span>
            </div>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              二维码单次有效，扫码后自动刷新。请使用手机扫码参与投票。
            </p>
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={async () => {
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
                          votes: opt.count,
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
                }}
                isLoading={simLoading}
              >
                模拟投票
              </Button>

              {simMessage ? (
                <div className="mt-2 text-sm text-slate-300">{simMessage}</div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8 bg-slate-800/50 rounded-2xl p-8 border border-slate-700 shadow-xl backdrop-blur-sm flex flex-col">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
            实时结果
          </h2>
          
          <div className="flex-1 w-full min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150} 
                  stroke="#e2e8f0" 
                  tick={{ fill: '#e2e8f0', fontSize: 14 }}
                />
                <Tooltip 
                  cursor={{ fill: '#334155', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="votes" radius={[0, 4, 4, 0]} animationDuration={500}>
                  <LabelList dataKey="votes" position="right" fill="#e2e8f0" />
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