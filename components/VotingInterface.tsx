import React, { useEffect, useState } from 'react';
import { Poll } from '../types';
import { api } from '../services/api';
import { Button } from './Button';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface VotingInterfaceProps {
  pollId: string;
  token: string;
}

export const VotingInterface: React.FC<VotingInterfaceProps> = ({ pollId, token }) => {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [status, setStatus] = useState<'loading' | 'active' | 'invalid' | 'voted'>('loading');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      // 1. Validate Token - 不使用长轮询，只需要立即检查token状态
      const tokenRes = await api.checkTokenStatus(token, false);
      
      if (!isMounted) return;

      if (!tokenRes.success || !tokenRes.data || tokenRes.data.pollId !== pollId || tokenRes.data.status === 'used') {
        setStatus('invalid');
        return;
      }

      // 2. Mark as scanned to inform Display
      if (tokenRes.data.status === 'active') {
        await api.markTokenScanned(token);
      }

      // 3. Load Poll
      const pollRes = await api.getPoll(pollId);
      if (isMounted && pollRes.success && pollRes.data) {
        setPoll(pollRes.data);
        setStatus('active');
      } else {
        setStatus('invalid');
      }
    };

    init();

    return () => { isMounted = false; };
  }, [pollId, token]);

  const handleSubmit = async () => {
    if (selectedOption && poll) {
      setSubmitting(true);
      // For web version, we need to generate or retrieve a unique identifier for the user
      // In a real implementation, you might want to use localStorage or another mechanism
      let openId = localStorage.getItem('user_open_id');
      if (!openId) {
        // Generate a unique ID for web users
        openId = 'web_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('user_open_id', openId);
      }
      const res = await api.vote(pollId, selectedOption, token, openId);
      setSubmitting(false);
      
      if (res.success) {
        setStatus('voted');
      } else {
        setStatus('invalid'); // Likely token used in race condition
      }
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-indigo-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">链接失效</h2>
          <p className="text-gray-500 mb-6">
            此投票链接已被使用或已失效。请重新扫描大屏幕上的二维码。
          </p>
        </div>
      </div>
    );
  }

  if (status === 'voted') {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-2xl text-center animate-in fade-in zoom-in duration-300">
          <div className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">投票成功！</h2>
          <p className="text-gray-500 mb-8">
            感谢您的参与，您的投票已实时显示在大屏幕上。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
        <header className="mb-8 pt-4">
          <span className="text-indigo-600 font-semibold tracking-wider text-sm uppercase">参与投票</span>
          <h1 className="text-3xl font-bold text-gray-900 mt-2 leading-tight">{poll?.title}</h1>
        </header>

        <div className="flex-1 space-y-4">
          {poll?.options.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 relative overflow-hidden group ${
                selectedOption === option.id
                  ? 'border-indigo-600 bg-indigo-50 shadow-md transform scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between relative z-10">
                <span className={`font-medium text-lg ${selectedOption === option.id ? 'text-indigo-900' : 'text-gray-700'}`}>
                  {option.text}
                </span>
                {selectedOption === option.id && (
                  <CheckCircle2 className="text-indigo-600" size={24} />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="py-6 mt-auto sticky bottom-0 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedOption || submitting}
            isLoading={submitting}
            className="w-full py-4 text-lg shadow-xl"
            icon={<ArrowRight />}
          >
            提交投票
          </Button>
        </div>
      </div>
    </div>
  );
};
