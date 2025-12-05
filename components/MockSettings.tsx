import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import { config } from '../services/config';
import { api } from '../services/api';
import { Settings, ExternalLink, RefreshCw } from 'lucide-react';

export const MockSettings: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showButton, setShowButton] = useState(false); // 控制齿轮按钮是否显示，初始为隐藏
  const [useMock, setUseMockState] = useState<boolean>(true);
  const [apiBase, setApiBaseState] = useState<string>('');
  const [showQrUrl, setShowQrUrlState] = useState<boolean>(false);
  const [showSimulateVote, setShowSimulateVoteState] = useState<boolean>(false); // 新增状态
  const [useMiniProgramQR, setUseMiniProgramQRState] = useState<boolean>(true); // 新增使用小程序二维码状态
  const [msg, setMsg] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    setUseMockState(config.getUseMock());
    setApiBaseState(config.getApiBase());
    setShowQrUrlState(config.getShowQrUrl());
    setShowSimulateVoteState(config.getShowSimulateVote()); // 初始化状态
    setUseMiniProgramQRState(config.getUseMiniProgramQR()); // 初始化使用小程序二维码状态
    setShowButton(false); // 确保每次组件挂载时都隐藏齿轮按钮
  }, []);

  // 添加键盘事件监听，实现alt+shift+k快捷键
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // 检查是否同时按下了alt+shift+k
      if (event.altKey && event.shiftKey && event.key === 'K') {
        event.preventDefault(); // 阻止默认行为
        setShowButton(prev => !prev); // 切换齿轮按钮的显示状态
      }
    };

    // 添加事件监听
    window.addEventListener('keydown', handleKeyPress);

    // 组件卸载时移除事件监听
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  const save = () => {
    try {
      config.setUseMock(useMock);
      config.setApiBase(apiBase);
      config.setShowQrUrl(showQrUrl);
      config.setShowSimulateVote(showSimulateVote); // 保存新配置
      config.setUseMiniProgramQR(useMiniProgramQR); // 保存使用小程序二维码配置
      
      // 触发自定义事件，通知其他组件配置已变化
      window.dispatchEvent(new CustomEvent('lv-config-changed', {
        detail: { key: 'USE_MINI_PROGRAM_QR' }
      }));
      
      setMsg('已保存');
      setTimeout(() => setMsg(null), 2000);
    } catch (e) {
      setMsg('保存失败');
      setTimeout(() => setMsg(null), 2000);
    }
  };

  return (
    <div>
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex items-end">
          {open && (
            <div className="w-80 bg-slate-800 text-white p-4 rounded-lg shadow-xl border border-slate-700 mr-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Settings />
                  <div className="font-medium">调试设置</div>
                </div>
                <div className="text-sm text-slate-400">调试开关</div>
              </div>

              <label className="flex items-center justify-between mb-3">
                <span className="text-sm">使用 Mock（localStorage）</span>
                <input
                  type="checkbox"
                  checked={useMock}
                  onChange={(e) => setUseMockState(e.target.checked)}
                />
              </label>

              <label className="flex items-center justify-between mb-3">
                <span className="text-sm">展示二维码链接</span>
                <input
                  type="checkbox"
                  checked={showQrUrl}
                  onChange={(e) => setShowQrUrlState(e.target.checked)}
                />
              </label>
              
              {/* 新增模拟投票开关 */}
              <label className="flex items-center justify-between mb-3">
                <span className="text-sm">展示模拟投票按钮</span>
                <input
                  type="checkbox"
                  checked={showSimulateVote}
                  onChange={(e) => setShowSimulateVoteState(e.target.checked)}
                />
              </label>

              {/* 新增使用小程序二维码开关 */}
              <label className="flex items-center justify-between mb-3">
                <span className="text-sm">使用小程序二维码</span>
                <input
                  type="checkbox"
                  checked={useMiniProgramQR}
                  onChange={(e) => setUseMiniProgramQRState(e.target.checked)}
                />
              </label>

              <label className="block text-sm text-slate-300">后端 API 域名</label>
              <input
                className="mt-1 w-full px-2 py-1 rounded bg-slate-700 text-white text-sm border border-slate-600"
                value={apiBase}
                onChange={(e) => setApiBaseState(e.target.value)}
              />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={save}>保存</Button>
                <Button variant="ghost" onClick={() => { 
                  setUseMockState(config.getUseMock()); 
                  setApiBaseState(config.getApiBase()); 
                  setShowQrUrlState(config.getShowQrUrl());
                  setShowSimulateVoteState(config.getShowSimulateVote()); // 重置状态
                  setUseMiniProgramQRState(config.getUseMiniProgramQR()); // 重置使用小程序二维码状态
                }}>重置</Button>
                <Button 
                  variant="secondary" 
                  isLoading={isRefreshing}
                  onClick={async () => {
                    setIsRefreshing(true);
                    try {
                      const result = await api.refreshWechatAccessToken();
                      if (result.success) {
                        setMsg('小程序Token已刷新');
                      } else {
                        setMsg(`刷新失败: ${result.error}`);
                      }
                    } catch (error) {
                      setMsg(`刷新失败: ${error}`);
                    } finally {
                      setIsRefreshing(false);
                      setTimeout(() => setMsg(null), 2000);
                    }
                  }}
                >
                  刷新wxToken
                </Button>
                <a className="ml-auto text-xs text-slate-300 flex items-center gap-1" href="/docs/API_BACKEND.md" target="_blank" rel="noreferrer">
                  文档
                  <ExternalLink size={14} />
                </a>
              </div>

              {msg && <div className="mt-2 text-sm text-slate-300">{msg}</div>}
            </div>
          )}

          {showButton && (
            <button
              className="p-3 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700"
              onClick={() => setOpen(o => !o)}
              title="打开调试设置"
            >
              <Settings />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MockSettings;