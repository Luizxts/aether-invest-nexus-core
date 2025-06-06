
import React from 'react';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import AuthPage from '@/components/AuthPage';
import RealBinanceSetup from '@/components/RealBinanceSetup';
import TradingDashboard from '@/components/TradingDashboard';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [appState, setAppState] = useState<'setup' | 'dashboard'>('setup');
  const [hasCredentials, setHasCredentials] = useState(false);

  useEffect(() => {
    if (user) {
      checkBinanceCredentials();
    }
  }, [user]);

  const checkBinanceCredentials = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_binance_credentials')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (data && !error) {
        setHasCredentials(true);
        setAppState('dashboard');
      } else {
        setHasCredentials(false);
        setAppState('setup');
      }
    } catch (err) {
      setHasCredentials(false);
      setAppState('setup');
    }
  };

  const handleSetupComplete = () => {
    setHasCredentials(true);
    setAppState('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center matrix-effect">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neon-blue">Carregando Seravat Invest...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (appState === 'setup' && !hasCredentials) {
    return <RealBinanceSetup onSetupComplete={handleSetupComplete} />;
  }

  return <TradingDashboard />;
};

const Index: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
