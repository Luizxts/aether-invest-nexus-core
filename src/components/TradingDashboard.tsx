
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Key,
  X,
  Loader2,
  Wifi,
  WifiOff
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
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error' | 'checking' | 'no-credentials'>('checking');
  const [hasCredentials, setHasCredentials] = useState(false);
  const [showCredentialsAlert, setShowCredentialsAlert] = useState(true);
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState<Date | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserData();
      const interval = setInterval(fetchRealTimeData, 60000); // Atualizar a cada minuto
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('portfolio_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'portfolio_data',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Portfolio updated:', payload);
        if (payload.new && typeof payload.new === 'object' && payload.new !== null) {
          const newData = payload.new as Record<string, any>;
          if ('total_balance' in newData && newData.total_balance !== undefined) {
            setRealTimeBalance(Number(newData.total_balance));
          }
          if ('daily_pnl' in newData && newData.daily_pnl !== undefined) {
            setDailyPnL(Number(newData.daily_pnl));
          }
          setLastBalanceUpdate(new Date());
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserProfile(profile);

      const { data: credentials } = await supabase
        .from('user_binance_credentials')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      setHasCredentials(!!credentials);
      if (!credentials) {
        setConnectionStatus('no-credentials');
      }

      const { data: portfolio } = await supabase
        .from('portfolio_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (portfolio) {
        setPortfolioData(portfolio);
        setRealTimeBalance(Number(portfolio.total_balance) || 0);
        setDailyPnL(Number(portfolio.daily_pnl) || 0);
        if (portfolio.last_updated) {
          setLastBalanceUpdate(new Date(portfolio.last_updated));
        }
      }

      const { data: risk } = await supabase
        .from('risk_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setRiskSettings(risk);

      if (credentials) {
        await fetchRealTimeData();
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do usuário",
        variant: "destructive",
      });
    }
  };

  const fetchRealTimeData = async () => {
    if (!user || !hasCredentials) {
      setConnectionStatus('no-credentials');
      return;
    }

    setIsLoadingBalance(true);
    setConnectionStatus('checking');
    setConnectionError(null);
    
    try {
      console.log('Fetching balance for user:', user.id);
      
      const response = await supabase.functions.invoke('get-binance-balance', {
        body: { userId: user.id }
      });

      console.log('Balance response:', response);

      // Verificar erro da edge function
      if (response.error) {
        console.error('Error from edge function:', response.error);
        setConnectionStatus('error');
        setConnectionError('Erro interno do servidor');
        
        toast({
          title: "Erro de sistema",
          description: "Erro interno do servidor. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // Verificar erro da API da Binance
      if (response.data?.error) {
        console.error('Error from Binance API:', response.data);
        setConnectionStatus('error');
        setConnectionError(response.data.error);
        
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

      // Sucesso - processar dados
      if (response.data?.balance !== undefined) {
        const newBalance = response.data.balance;
        const pnl = newBalance - realTimeBalance;
        
        console.log('New balance:', newBalance);
        console.log('Balance details:', response.data);
        
        setRealTimeBalance(newBalance);
        if (pnl !== 0) {
          setDailyPnL(prev => prev + pnl);
        }
        setBalanceDetails(response.data);
        setConnectionStatus('connected');
        setConnectionError(null);
        setLastBalanceUpdate(new Date());

        await supabase
          .from('portfolio_data')
          .upsert({
            user_id: user.id,
            total_balance: newBalance,
            daily_pnl: dailyPnL + (pnl !== 0 ? pnl : 0),
            last_updated: new Date().toISOString()
          });

        if (response.data.message && pnl !== 0) {
          toast({
            title: "Saldo atualizado!",
            description: response.data.message,
          });
        }
      } else {
        console.error('No balance data received:', response.data);
        setConnectionStatus('error');
        setConnectionError('Dados de saldo não encontrados');
        toast({
          title: "Erro de dados",
          description: "Não foi possível obter o saldo da Binance",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      setConnectionStatus('error');
      setConnectionError('Erro de conexão');
      toast({
        title: "Erro de conexão",
        description: "Erro ao conectar com a Binance. Verifique sua conexão.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const toggleTrading = async () => {
    if (!user || !riskSettings) return;

    if (!hasCredentials) {
      toast({
        title: "Credenciais necessárias",
        description: "Configure suas credenciais da Binance primeiro",
        variant: "destructive",
      });
      return;
    }

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
        
        toast({
          title: newTradingState ? "Trading iniciado!" : "Trading pausado!",
          description: newTradingState 
            ? "A IA está agora operando automaticamente" 
            : "Todas as operações automáticas foram pausadas",
        });
      }
    } catch (error) {
      console.error('Error toggling trading:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do trading",
        variant: "destructive",
      });
    }
  };

  const handleCredentialsUpdated = () => {
    setHasCredentials(true);
    setConnectionStatus('checking');
    setShowCredentialsAlert(false);
    setConnectionError(null);
    fetchRealTimeData();
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

  const getStatusBadge = () => {
    if (!hasCredentials) {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
          <Key className="w-4 h-4 mr-2" />
          Configure API
        </Badge>
      );
    }
    
    if (connectionStatus === 'connected') {
      return (
        <Badge variant="outline" className="border-neon-green text-neon-green">
          <Wifi className="w-4 h-4 mr-2" />
          Binance Conectada
        </Badge>
      );
    }
    
    if (connectionStatus === 'error') {
      return (
        <Badge variant="outline" className="border-red-500 text-red-500">
          <WifiOff className="w-4 h-4 mr-2" />
          Erro de Conexão
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="border-gray-500 text-gray-500">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Verificando...
      </Badge>
    );
  };

  const formatLastUpdate = () => {
    if (!lastBalanceUpdate) return "Nunca";
    
    const now = new Date();
    const diff = now.getTime() - lastBalanceUpdate.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Agora";
    if (minutes === 1) return "1 minuto atrás";
    if (minutes < 60) return `${minutes} minutos atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return "1 hora atrás";
    if (hours < 24) return `${hours} horas atrás`;
    
    const days = Math.floor(hours / 24);
    return `${days} dia${days > 1 ? 's' : ''} atrás`;
  };

  return (
    <div className="min-h-screen bg-matrix-dark p-4 matrix-effect">
      {!hasCredentials && showCredentialsAlert && (
        <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
          <Key className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-200 flex items-center justify-between">
            <span>
              <strong>Configure suas credenciais da Binance</strong> com permissão "Spot & Margin Trading" para começar a operar. 
              Vá na aba "Configurações" para inserir sua API Key e Secret Key.
            </span>
            <Button
              onClick={() => setShowCredentialsAlert(false)}
              variant="ghost"
              size="sm"
              className="text-yellow-300 hover:text-yellow-100 ml-4"
            >
              <X className="w-4 h-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {connectionError && (
        <Alert className="mb-6 border-red-500/50 bg-red-500/10">
          <WifiOff className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-200 flex items-center justify-between">
            <span>
              <strong>Erro de conexão:</strong> {connectionError}
            </span>
            <Button
              onClick={() => setConnectionError(null)}
              variant="ghost"
              size="sm"
              className="text-red-300 hover:text-red-100 ml-4"
            >
              <X className="w-4 h-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
            {getStatusBadge()}
            
            <Button
              onClick={fetchRealTimeData}
              disabled={isLoadingBalance || !hasCredentials}
              variant="outline"
              size="sm"
              className="border-neon-blue text-neon-blue hover:bg-neon-blue/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingBalance ? 'animate-spin' : ''}`} />
              {isLoadingBalance ? 'Atualizando...' : 'Atualizar Saldo'}
            </Button>

            <Button
              onClick={toggleTrading}
              disabled={!hasCredentials}
              className={`${
                riskSettings.is_trading_active 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white ${!hasCredentials ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  <p className="text-xs text-gray-500">
                    Última atualização: {formatLastUpdate()}
                  </p>
                  {!hasCredentials && (
                    <p className="text-xs text-yellow-400">
                      Configure API primeiro
                    </p>
                  )}
                  {isLoadingBalance && (
                    <p className="text-xs text-blue-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Atualizando...
                    </p>
                  )}
                </div>
                <DollarSign className={`w-8 h-8 ${
                  hasCredentials && connectionStatus === 'connected' ? 'text-neon-blue' : 'text-gray-500'
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
                    riskSettings.is_trading_active && hasCredentials ? 'text-neon-green' : 'text-gray-400'
                  }`}>
                    {riskSettings.is_trading_active && hasCredentials ? 'Ativo' : 'Parado'}
                  </p>
                </div>
                <Activity className={`w-8 h-8 ${
                  riskSettings.is_trading_active && hasCredentials ? 'text-neon-green animate-pulse' : 'text-gray-400'
                }`} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
                  supabase
                    .from('risk_settings')
                    .update({ trading_mode: mode })
                    .eq('user_id', user?.id);
                  setRiskSettings({...riskSettings, trading_mode: mode});
                }}
                isTrading={riskSettings.is_trading_active}
                hasCredentials={hasCredentials}
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
            isActive={riskSettings.is_trading_active && hasCredentials}
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
              supabase
                .from('risk_settings')
                .update(newSettings)
                .eq('user_id', user?.id);
              setRiskSettings(newSettings);
            }}
            onCredentialsUpdated={handleCredentialsUpdated}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TradingDashboard;
