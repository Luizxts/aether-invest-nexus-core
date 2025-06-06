
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Settings, 
  Brain, 
  Shield, 
  AlertTriangle,
  Activity,
  Eye,
  Zap
} from 'lucide-react';
import TradingChart from './TradingChart';
import AIStatus from './AIStatus';
import RiskSettings from './RiskSettings';
import TradingModeSelector from './TradingModeSelector';
import NewsPanel from './NewsPanel';
import PortfolioOverview from './PortfolioOverview';

interface TradingDashboardProps {
  username: string;
  apiKey: string;
  secretKey: string;
}

const TradingDashboard: React.FC<TradingDashboardProps> = ({ 
  username, 
  apiKey, 
  secretKey 
}) => {
  const [aiLevel, setAiLevel] = useState(1);
  const [tradingMode, setTradingMode] = useState<'safe' | 'danger'>('safe');
  const [isTrading, setIsTrading] = useState(false);
  const [balance, setBalance] = useState(10000);
  const [dailyPnL, setDailyPnL] = useState(0);
  const [riskSettings, setRiskSettings] = useState({
    maxDailyLoss: 5,
    maxRiskPerTrade: 2,
    stopLoss: true
  });

  // Simular dados de trading em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      if (isTrading) {
        const change = (Math.random() - 0.5) * 100;
        setDailyPnL(prev => prev + change);
        setBalance(prev => prev + change);
        
        // Simular evolução da IA
        if (Math.random() > 0.99) {
          setAiLevel(prev => Math.min(prev + 1, 100));
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isTrading]);

  const toggleTrading = () => {
    setIsTrading(!isTrading);
  };

  return (
    <div className="min-h-screen bg-matrix-dark p-4 matrix-effect">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold neon-text">
              Seravat Invest
            </h1>
            <p className="text-gray-400">
              Bem-vindo, <span className="text-neon-blue">{username}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-neon-green text-neon-green">
              <Eye className="w-4 h-4 mr-2" />
              Binance Conectada
            </Badge>
            
            <Button
              onClick={toggleTrading}
              className={`${
                isTrading 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {isTrading ? 'Parar Trading' : 'Iniciar Trading'}
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Saldo Total</p>
                  <p className="text-2xl font-bold text-white">
                    ${balance.toFixed(2)}
                  </p>
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
                    Nível {aiLevel}
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
                    isTrading ? 'text-neon-green' : 'text-gray-400'
                  }`}>
                    {isTrading ? 'Ativo' : 'Parado'}
                  </p>
                </div>
                <Activity className={`w-8 h-8 ${
                  isTrading ? 'text-neon-green animate-pulse' : 'text-gray-400'
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
                mode={tradingMode} 
                onModeChange={setTradingMode}
                isTrading={isTrading}
              />
              <PortfolioOverview balance={balance} pnl={dailyPnL} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trading" className="space-y-4">
          <TradingChart />
        </TabsContent>

        <TabsContent value="ai-status" className="space-y-4">
          <AIStatus 
            level={aiLevel} 
            isActive={isTrading}
            mode={tradingMode}
          />
        </TabsContent>

        <TabsContent value="news" className="space-y-4">
          <NewsPanel />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <RiskSettings 
            settings={riskSettings}
            onSettingsChange={setRiskSettings}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TradingDashboard;
