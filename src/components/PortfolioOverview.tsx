
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface PortfolioOverviewProps {
  balance: number;
  pnl: number;
}

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ balance, pnl }) => {
  const portfolioData = [
    { name: 'BTC', value: 45, color: '#f7931a' },
    { name: 'ETH', value: 30, color: '#627eea' },
    { name: 'BNB', value: 15, color: '#f3ba2f' },
    { name: 'USDT', value: 10, color: '#26a17b' },
  ];

  const positions = [
    { symbol: 'BTCUSDT', side: 'LONG', size: 0.5, pnl: 234.56, change: 2.3 },
    { symbol: 'ETHUSDT', side: 'SHORT', size: 2.1, pnl: -89.23, change: -1.8 },
    { symbol: 'BNBUSDT', side: 'LONG', size: 15.0, pnl: 156.78, change: 3.2 },
  ];

  return (
    <div className="space-y-4">
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-neon-green" />
            Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={portfolioData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {portfolioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-2">
            {portfolioData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-white">{item.name}</span>
                </div>
                <span className="text-sm text-gray-400">{item.value}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">
            🎯 Posições Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {positions.map((position, index) => (
              <div 
                key={index}
                className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {position.symbol}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      position.side === 'LONG' 
                        ? 'bg-green-600/20 text-green-400' 
                        : 'bg-red-600/20 text-red-400'
                    }`}>
                      {position.side}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {position.pnl >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-neon-green" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`text-sm font-semibold ${
                      position.pnl >= 0 ? 'text-neon-green' : 'text-red-400'
                    }`}>
                      ${position.pnl.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Tamanho: {position.size}</span>
                  <span className={position.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {position.change >= 0 ? '+' : ''}{position.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioOverview;
