import React, { useEffect, useState } from 'react';
import { Poll } from '../types';
import { api } from '../services/api';
import { Button } from './Button';
import { Plus, BarChart2, Calendar, ChevronRight, Layout } from 'lucide-react';

interface PollListProps {
  onNavigate: (path: string) => void;
}

export const PollList: React.FC<PollListProps> = ({ onNavigate }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await api.getPolls();
        if (response.success && response.data) {
          setPolls(response.data);
        }
      } catch (e) {
        console.error("Failed to fetch polls", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPolls();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Layout className="text-indigo-600" />
              活动列表
            </h1>
            <p className="mt-2 text-gray-600">管理您的所有现场投票活动</p>
          </div>
          <Button onClick={() => onNavigate('/create')} icon={<Plus />}>
            创建新活动
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        ) : polls.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="mx-auto h-16 w-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
              <BarChart2 size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无活动</h3>
            <p className="text-gray-500 mb-6">您还没有创建任何投票活动。</p>
            <Button variant="secondary" onClick={() => onNavigate('/create')}>
              立即创建
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {polls.map((poll) => (
              <div 
                key={poll.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-gray-900 truncate mb-1">
                    {poll.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(poll.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      进行中
                    </span>
                    <span>
                      {poll.options.reduce((acc, opt) => acc + opt.count, 0)} 票
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                   <Button 
                    variant="primary" 
                    onClick={() => onNavigate(`/display/${poll.id}`)}
                    className="flex-1 sm:flex-none"
                    icon={<BarChart2 size={18} />}
                  >
                    进入大屏
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
