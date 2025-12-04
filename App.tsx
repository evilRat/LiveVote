import React, { useEffect, useState } from 'react';
import { PollList } from './components/PollList';
import { CreatePoll } from './components/CreatePoll';
import { PollDisplay } from './components/PollDisplay';
import { VotingInterface } from './components/VotingInterface';
import { WechatQRTest } from './components/WechatQRTest'; // 添加导入
import { Login } from './components/Login';
import { Route } from './types';
import MockSettings from './components/MockSettings';
import { storageService } from './services/storageService';
import { LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [route, setRoute] = useState<Route>({ path: 'list', params: {} });
  const [isLoggedIn, setIsLoggedIn] = useState(storageService.isLoggedIn());
  const [user, setUser] = useState(storageService.getUser());

  // Handle login success
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setUser(storageService.getUser());
    navigate('/list');
  };

  // Handle logout
  const handleLogout = () => {
    storageService.logout();
    setIsLoggedIn(false);
    setUser(null);
    navigate('/login');
  };

  // Check login status on mount
  useEffect(() => {
    const checkLoginStatus = () => {
      setIsLoggedIn(storageService.isLoggedIn());
      setUser(storageService.getUser());
    };
    checkLoginStatus();
  }, []);

  // Custom Hash Router implementation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove '#'
      
      // Public routes (no authentication required)
      const publicRoutes = ['/login', '/vote'];
      const isPublicRoute = publicRoutes.some(route => 
        hash === route || hash.startsWith(`${route}/`)
      );
      
      // Check if user is logged in
      const loggedIn = storageService.isLoggedIn();
      setIsLoggedIn(loggedIn);
      setUser(storageService.getUser());
      
      // Redirect to login if not logged in and trying to access protected route
      if (!loggedIn && !isPublicRoute) {
        navigate('/login');
        return;
      }
      
      // Redirect to list if already logged in and on login page
      if (loggedIn && hash === '/login') {
        navigate('/list');
        return;
      }
      
      // Route handling
      if (!hash || hash === '/') {
        setRoute({ path: 'list', params: {} });
        return;
      }

      if (hash === '/login') {
        setRoute({ path: 'login', params: {} });
        return;
      }

      if (hash === '/create') {
        setRoute({ path: 'create', params: {} });
        return;
      }

      // /display/:pollId
      if (hash.startsWith('/display/')) {
        const parts = hash.split('/');
        const pollId = parts[2];
        if (pollId) {
          setRoute({ path: 'display', params: { pollId } });
        } else {
          setRoute({ path: 'list', params: {} });
        }
        return;
      }

      // /vote/:pollId/:token
      if (hash.startsWith('/vote/')) {
        const parts = hash.split('/');
        const pollId = parts[2];
        const token = parts[3];
        if (pollId && token) {
          setRoute({ path: 'vote', params: { pollId, token } });
        } else {
          // Invalid vote link
          setRoute({ path: 'list', params: {} }); 
        }
        return;
      }

      // /wechat-qr-test (添加微信二维码测试页面路由)
      if (hash === '/wechat-qr-test') {
        setRoute({ path: 'wechat-qr-test', params: {} });
        return;
      }

      setRoute({ path: 'list', params: {} });
    };

    // Initial check
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  let content = null;
  switch (route.path) {
    case 'login':
      content = <Login onLoginSuccess={handleLoginSuccess} />;
      break;
    case 'display':
      content = <PollDisplay pollId={route.params.pollId} onBack={() => navigate('/list')} />;
      break;
    case 'vote':
      content = <VotingInterface pollId={route.params.pollId} token={route.params.token} />;
      break;
    case 'create':
      content = <CreatePoll onCreated={() => navigate('/list')} onCancel={() => navigate('/list')} />;
      break;
    case 'wechat-qr-test': // 添加微信二维码测试页面
      content = <WechatQRTest />;
      break;
    case 'list':
    default:
      content = <PollList onNavigate={navigate} />;
  }

  // Add user info and logout button if logged in
  const renderHeader = () => {
    if (!isLoggedIn) return null;
    
    return (
      <div className="fixed top-0 right-0 p-4 flex items-center gap-3 z-50">
        <span className="text-sm text-gray-600">
          欢迎, {user?.username}
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
        >
          <LogOut size={16} />
          退出登录
        </button>
      </div>
    );
  };

  return (
    <div>
      {renderHeader()}
      {content}
      <MockSettings />
    </div>
  );
};

export default App;