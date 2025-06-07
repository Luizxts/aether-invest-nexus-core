import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Brain, 
  Activity,
  Eye,
  LogOut,
  RefreshCw,
  AlertTriangle,
  Settings
} from 'lucide-react';
import TradingChart from './TradingChart';
import AIStatus from './AIStatus';
import RiskSettings from './RiskSettings';
import TradingModeSelector from './TradingModeSelector';
import NewsPanel from './NewsPanel';
import PortfolioOverview from './PortfolioOverview';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const TradingDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [riskSettings, setRiskSettings] = useState<any>(null);
  const [realTimeBalance, setRealTimeBalance] = useState(0);
  const [dailyPnL, setDailyPnL] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceDetails, setBalanceDetails] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error' | 'checking'>('checking');

  useEffect(() => {
    if (user) {
      fetchUserData();
      const interval = setInterval(fetchRealTimeData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Buscar perfil do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserProfile(profile);

      // Buscar dados do portfólio
      const { data: portfolio } = await supabase
        .from('portfolio_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (portfolio) {
        setPortfolioData(portfolio);
        setRealTimeBalance(Number(portfolio.total_balance));
        setDailyPnL(Number(portfolio.daily_pnl));
      }

      // Buscar configurações de risco
      const { data: risk } = await supabase
        .from('risk_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setRiskSettings(risk);

      // Buscar saldo inicial da Binance
      await fetchRealTimeData();

    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchRealTimeData = async () => {
    if (!user) return;

    setIsLoadingBalance(true);
    setConnectionStatus('checking');
    
    try {
      console.log('Fetching balance for user:', user.id);
      
      const response = await supabase.functions.invoke('get-binance-balance', {
        body: { userId: user.id }
      });

      console.log('Balance response:', response);

      if (response.error) {
        console.error('Error from edge function:', response.error);
        setConnectionStatus('error');
        
        toast({
          title: "Erro ao conectar com Binance",
          description: "Verifique suas credenciais e tente novamente",
          variant: "destructive",
        });
        return;
      }

      if (response.data?.error) {
        console.error('Error from Binance API:', response.data);
        setConnectionStatus('error');
        
        let errorTitle = "Erro na Binance";
        let errorDescription = response.data.error;
        
        if (response.data.details) {
          errorDescription = response.data.details;
        }
        
        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
        });
        return;
      }

      if (response.data?.balance !== undefined) {
        const newBalance = response.data.balance;
        const pnl = newBalance - realTimeBalance;
        
        console.log('New balance:', newBalance);
        console.log('Balance details:', response.data);
        
        setRealTimeBalance(newBalance);
        setDailyPnL(prev => prev + pnl);
        setBalanceDetails(response.data);
        setConnectionStatus('connected');

        // Atualizar no banco de dados
        await supabase
          .from('portfolio_data')
          .upsert({
            user_id: user.id,
            total_balance: newBalance,
            daily_pnl: dailyPnL + pnl,
            last_updated: new Date().toISOString()
          });

        if (response.data.message) {
          toast({
            title: "Saldo atualizado!",
            description: response.data.message,
          });
        }
      } else {
        console.error('No balance data received:', response.data);
        setConnectionStatus('error');
        toast({
          title: "Erro de dados",
          description: "Não foi possível obter o saldo da Binance",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      setConnectionStatus('error');
      toast({
        title: "Erro de conexão",
        description: "Erro ao conectar com a Binance. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const goToSetup = () => {
    // Redirect to setup by clearing credentials and refreshing
    if (user) {
      supabase
        .from('user_binance_credentials')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .then(() => {
          window.location.reload();
        });
    }
  };

  const toggleTrading = async () => {
    if (!user || !riskSettings) return;

    const newTradingState = !riskSettings.is_trading_active;

    try {
      const { error } = await supabase
        .from('risk_settings')
        .update({ is_trading_active: newTradingState })
        .eq('user_id', user.id);

      if (!error) {
        setRiskSettings({
          ...riskSettings,
          is_trading_active: newTradingState
        });
      }
    } catch (error) {
      console.error('Error toggling trading:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (!userProfile || !portfolioData || !riskSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center matrix-effect">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neon-blue">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-matrix-dark p-4 matrix-effect">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold neon-text">
              Seravat Invest Pro
            </h1>
            <p className="text-gray-400">
              Bem-vindo, <span className="text-neon-blue">{userProfile.username || user.email}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {connectionStatus === 'connected' && (
              <Badge variant="outline" className="border-neon-green text-neon-green">
                <Eye className="w-4 h-4 mr-2" />
                Binance Conectada
              </Badge>
            )}
            
            {connectionStatus === 'error' && (
              <Badge variant="outline" className="border-red-500 text-red-500">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Erro de Conexão
              </Badge>
            )}
            
            <Button
              onClick={fetchRealTimeData}
              disabled={isLoadingBalance}
              variant="outline"
              size="sm"
              className="border-neon-blue text-neon-blue hover:bg-neon-blue/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingBalance ? 'animate-spin' : ''}`} />
              {isLoadingBalance ? 'Atualizando...' : 'Atualizar Saldo'}
            </Button>

            {connectionStatus === 'error' && (
              <Button
                onClick={goToSetup}
                variant="outline"
                size="sm"
                className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
              >
                <Settings className="w-4 h-4 mr-2" />
                Reconfigurar Binance
              </Button>
            )}

            <Button
              onClick={toggleTrading}
              className={`${
                riskSettings.is_trading_active 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {riskSettings.is_trading_active ? 'Parar Trading' : 'Iniciar Trading'}
            </Button>

            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Saldo Real (USDT)</p>
                  <p className="text-2xl font-bold text-white">
                    ${realTimeBalance.toFixed(2)}
                  </p>
                  {balanceDetails?.debug && (
                    <p className="text-xs text-gray-500">
                      {balanceDetails.debug.nonZeroAssets} ativos
                    </p>
                  )}
                  {connectionStatus === 'error' && (
                    <p className="text-xs text-red-400">
                      Erro de conexão
                    </p>
                  )}
                </div>
                <DollarSign className={`w-8 h-8 ${
                  connectionStatus === 'connected' ? 'text-neon-blue' : 'text-gray-500'
                }`} />
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">P&L Diário</p>
                  <p className={`text-2xl font-bold ${
                    dailyPnL >= 0 ? 'text-neon-green' : 'text-red-400'
                  }`}>
                    {dailyPnL >= 0 ? '+' : ''}${dailyPnL.toFixed(2)}
                  </p>
                </div>
                {dailyPnL >= 0 ? (
                  <TrendingUp className="w-8 h-8 text-neon-green" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-400" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Nível da IA</p>
                  <p className="text-2xl font-bold text-neon-purple">
                    Nível {riskSettings.ai_level}
                  </p>
                </div>
                <Brain className="w-8 h-8 text-neon-purple animate-pulse-neon" />
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p className={`text-lg font-bold ${
                    riskSettings.is_trading_active ? 'text-neon-green' : 'text-gray-400'
                  }`}>
                    {riskSettings.is_trading_active ? 'Ativo' : 'Parado'}
                  </p>
                </div>
                <Activity className={`w-8 h-8 ${
                  riskSettings.is_trading_active ? 'text-neon-green animate-pulse' : 'text-gray-400'
                }`} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-gray-800/50">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="ai-status">IA Status</TabsTrigger>
          <TabsTrigger value="news">Notícias</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TradingChart />
            </div>
            <div className="space-y-4">
              <TradingModeSelector 
                mode={riskSettings.trading_mode} 
                onModeChange={(mode) => {
                  // Atualizar no banco de dados
                  supabase
                    .from('risk_settings')
                    .update({ trading_mode: mode })
                    .eq('user_id', user?.id);
                  setRiskSettings({...riskSettings, trading_mode: mode});
                }}
                isTrading={riskSettings.is_trading_active}
              />
              <PortfolioOverview balance={realTimeBalance} pnl={dailyPnL} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trading" className="space-y-4">
          <TradingChart />
        </TabsContent>

        <TabsContent value="ai-status" className="space-y-4">
          <AIStatus 
            level={riskSettings.ai_level} 
            isActive={riskSettings.is_trading_active}
            mode={riskSettings.trading_mode}
          />
        </TabsContent>

        <TabsContent value="news" className="space-y-4">
          <NewsPanel />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <RiskSettings 
            settings={riskSettings}
            onSettingsChange={(newSettings) => {
              // Atualizar no banco de dados
              supabase
                .from('risk_settings')
                .update(newSettings)
                .eq('user_id', user?.id);
              setRiskSettings(newSettings);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TradingDashboard;
