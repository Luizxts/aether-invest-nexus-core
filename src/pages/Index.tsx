
import React from 'react';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import AuthPage from '@/components/AuthPage';
import TradingDashboard from '@/components/TradingDashboard';
import TutorialModal from '@/components/TutorialModal';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  useEffect(() => {
    if (user) {
      checkTutorialStatus();
    }
  }, [user]);

  const checkTutorialStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('has_seen_tutorial')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking tutorial status:', error);
        // If there's an error, show tutorial by default
        setShowTutorial(true);
        return;
      }

      if (data && !data.has_seen_tutorial) {
        setShowTutorial(true);
      } else {
        setHasSeenTutorial(true);
      }
    } catch (err) {
      console.error('Error in checkTutorialStatus:', err);
      // If tutorial status doesn't exist, show tutorial
      setShowTutorial(true);
    }
  };

  const handleTutorialComplete = async (skipped = false) => {
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ has_seen_tutorial: true })
          .eq('id', user.id);
        
        if (error) {
          console.error('Error updating tutorial status:', error);
        }
      } catch (err) {
        console.error('Error in handleTutorialComplete:', err);
      }
    }
    setShowTutorial(false);
    setHasSeenTutorial(true);
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

  return (
    <>
      <TradingDashboard />
      {showTutorial && (
        <TutorialModal 
          onComplete={handleTutorialComplete}
          onSkip={() => handleTutorialComplete(true)}
        />
      )}
    </>
  );
};

const Index: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
