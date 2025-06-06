
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const TradingChart: React.FC = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentPrice, setCurrentPrice] = useState(45234.56);
  const [priceChange, setPriceChange] = useState(2.34);

  // Gerar dados simulados para o gráfico
  useEffect(() => {
    const generateData = () => {
      const now = new Date();
      const data = [];
      
      for (let i = 30; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60000); // 30 pontos de 1 minuto cada
        const price = 45000 + Math.random() * 1000 + Math.sin(i * 0.1) * 500;
        
        data.push({
          time: time.toLocaleTimeString(),
          price: price,
          volume: Math.random() * 1000000,
        });
      }
      
      return data;
    };

    setChartData(generateData());

    // Atualizar dados em tempo real
    const interval = setInterval(() => {
      setChartData(prev => {
        const newData = [...prev];
        const lastPrice = newData[newData.length - 1]?.price || 45234;
        const change = (Math.random() - 0.5) * 100;
        const newPrice = lastPrice + change;
        
        setCurrentPrice(newPrice);
        setPriceChange(change);
        
        newData.push({
          time: new Date().toLocaleTimeString(),
          price: newPrice,
          volume: Math.random() * 1000000,
        });
        
        return newData.slice(-30); // Manter apenas os últimos 30 pontos
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="cyber-card h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-white">
            BTC/USDT
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-white">
                ${currentPrice.toFixed(2)}
              </p>
              <Badge 
                variant={priceChange >= 0 ? "default" : "destructive"}
                className={priceChange >= 0 ? "bg-green-600" : "bg-red-600"}
              >
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9CA3AF"
                fontSize={12}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                domain={['dataMin - 100', 'dataMax + 100']}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#00ff88"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <p className="text-xs text-gray-400">24h High</p>
            <p className="text-sm font-semibold text-neon-green">
              ${(currentPrice * 1.05).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">24h Low</p>
            <p className="text-sm font-semibold text-red-400">
              ${(currentPrice * 0.95).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Volume</p>
            <p className="text-sm font-semibold text-neon-blue">
              ${(Math.random() * 1000000000).toFixed(0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingChart;
