
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
  RefreshCw
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

  useEffect(() => {
    if (user) {
      fetchUserData();
      const interval = setInterval(fetchRealTimeData, 30000); // Atualizar a cada 30 segundos
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
    try {
      console.log('Fetching balance for user:', user.id);
      
      const response = await supabase.functions.invoke('get-binance-balance', {
        body: { userId: user.id }
      });

      console.log('Balance response:', response);

      if (response.error) {
        console.error('Error from edge function:', response.error);
        toast({
          title: "Erro ao buscar saldo",
          description: `Erro: ${response.error.message || 'Erro desconhecido'}`,
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

        // Atualizar no banco de dados
        await supabase
          .from('portfolio_data')
          .upsert({
            user_id: user.id,
            total_balance: newBalance,
            daily_pnl: dailyPnL + pnl,
            last_updated: new Date().toISOString()
          });

        toast({
          title: "Saldo atualizado",
          description: `Saldo atual: $${newBalance.toFixed(2)} USDT`,
        });
      } else {
        console.error('No balance data received:', response.data);
        toast({
          title: "Erro ao buscar saldo",
          description: "Não foi possível obter o saldo da Binance",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      toast({
        title: "Erro de conexão",
        description: "Erro ao conectar com a Binance. Verifique suas credenciais.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBalance(false);
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
            <Badge variant="outline" className="border-neon-green text-neon-green">
              <Eye className="w-4 h-4 mr-2" />
              Binance Conectada (Real)
            </Badge>
            
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
                </div>
                <DollarSign className="w-8 h-8 text-neon-blue" />
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
