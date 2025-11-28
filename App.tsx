import React, { useEffect, useState } from 'react';
import { PollList } from './components/PollList';
import { CreatePoll } from './components/CreatePoll';
import { PollDisplay } from './components/PollDisplay';
import { VotingInterface } from './components/VotingInterface';
import { Route } from './types';
import MockSettings from './components/MockSettings';

const App: React.FC = () => {
  const [route, setRoute] = useState<Route>({ path: 'list', params: {} });

  // Custom Hash Router implementation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove '#'
      
      if (!hash || hash === '/') {
        setRoute({ path: 'list', params: {} });
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
    case 'display':
      content = <PollDisplay pollId={route.params.pollId} onBack={() => navigate('/list')} />;
      break;
    case 'vote':
      content = <VotingInterface pollId={route.params.pollId} token={route.params.token} />;
      break;
    case 'create':
      content = <CreatePoll onCreated={() => navigate('/list')} onCancel={() => navigate('/list')} />;
      break;
    case 'list':
    default:
      content = <PollList onNavigate={navigate} />;
  }

  return (
    <div>
      {content}
      <MockSettings />
    </div>
  );
};

export default App;