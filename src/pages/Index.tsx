
import React, { useState } from 'react';
import LoginPage from '@/components/LoginPage';
import BinanceSetup from '@/components/BinanceSetup';
import TradingDashboard from '@/components/TradingDashboard';

type AppState = 'login' | 'setup' | 'dashboard';

const Index: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('login');
  const [username, setUsername] = useState('');
  const [apiCredentials, setApiCredentials] = useState({ apiKey: '', secretKey: '' });

  const handleLogin = (user: string) => {
    setUsername(user);
    setAppState('setup');
  };

  const handleSetupComplete = (apiKey: string, secretKey: string) => {
    setApiCredentials({ apiKey, secretKey });
    setAppState('dashboard');
  };

  const renderCurrentState = () => {
    switch (appState) {
      case 'login':
        return <LoginPage onLogin={handleLogin} />;
      case 'setup':
        return <BinanceSetup onSetupComplete={handleSetupComplete} />;
      case 'dashboard':
        return (
          <TradingDashboard 
            username={username}
            apiKey={apiCredentials.apiKey}
            secretKey={apiCredentials.secretKey}
          />
        );
      default:
        return <LoginPage onLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderCurrentState()}
    </div>
  );
};

export default Index;
