
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Globe, Brain, Activity } from 'lucide-react';

const NewsPanel: React.FC = () => {
  const [sentiment, setSentiment] = useState(0.72); // 0.72 = 72% positivo
  const [marketEmotions, setMarketEmotions] = useState({
    fear: 25,
    greed: 75,
    euphoria: 45,
    panic: 15
  });

  // Simular mudanças no sentimento
  useEffect(() => {
    const interval = setInterval(() => {
      setSentiment(0.3 + Math.random() * 0.4); // Entre 30% e 70%
      setMarketEmotions({
        fear: Math.floor(Math.random() * 50),
        greed: Math.floor(Math.random() * 100),
        euphoria: Math.floor(Math.random() * 80),
        panic: Math.floor(Math.random() * 30)
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const newsData = [
    {
      title: "Bitcoin atinge novo suporte em $45.000",
      source: "CoinTelegraph",
      time: "2 min",
      sentiment: "positive",
      impact: "high"
    },
    {
      title: "Ethereum se prepara para próxima atualização",
      source: "DeFi Pulse",
      time: "5 min",
      sentiment: "positive",
      impact: "medium"
    },
    {
      title: "Regulamentação cripto avança nos EUA",
      source: "Bloomberg",
      time: "12 min",
      sentiment: "neutral",
      impact: "high"
    },
    {
      title: "Volume de trading aumenta 25% nas últimas 24h",
      source: "CryptoQuant",
      time: "18 min",
      sentiment: "positive",
      impact: "medium"
    }
  ];

  const socialData = [
    {
      platform: "Twitter",
      mentions: 15420,
      sentiment: 0.68,
      trending: ["#Bitcoin", "#DeFi", "#Altcoins"]
    },
    {
      platform: "Reddit",
      mentions: 8930,
      sentiment: 0.71,
      trending: ["BTC Analysis", "ETH Price", "Crypto News"]
    },
    {
      platform: "Discord",
      mentions: 5240,
      sentiment: 0.65,
      trending: ["Trading Signals", "Market Update", "Portfolio"]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Sentimento Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cyber-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Sentimento Geral</p>
                <p className={`text-2xl font-bold ${
                  sentiment > 0.6 ? 'text-neon-green' : 
                  sentiment > 0.4 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {(sentiment * 100).toFixed(0)}%
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
                <p className="text-sm text-gray-400">Fear & Greed</p>
                <p className="text-2xl font-bold text-neon-blue">
                  {marketEmotions.greed}
                </p>
              </div>
              <Activity className="w-8 h-8 text-neon-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="cyber-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Volatilidade Social</p>
                <p className="text-2xl font-bold text-neon-yellow">
                  {Math.floor(sentiment * 100 + Math.random() * 20)}%
                </p>
              </div>
              <Globe className="w-8 h-8 text-neon-yellow" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="news" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
          <TabsTrigger value="news">Notícias</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="analysis">Análise IA</TabsTrigger>
        </TabsList>

        <TabsContent value="news" className="space-y-4">
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">
                📰 Notícias em Tempo Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {newsData.map((news, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-neon-blue/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">
                          {news.title}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span>{news.source}</span>
                          <span>•</span>
                          <span>{news.time}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline"
                          className={
                            news.sentiment === 'positive' ? 'border-green-500 text-green-400' :
                            news.sentiment === 'negative' ? 'border-red-500 text-red-400' :
                            'border-yellow-500 text-yellow-400'
                          }
                        >
                          {news.sentiment === 'positive' ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : news.sentiment === 'negative' ? (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          ) : (
                            <Activity className="w-3 h-3 mr-1" />
                          )}
                          {news.impact}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {socialData.map((platform, index) => (
              <Card key={index} className="cyber-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white">
                    {platform.platform}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-400">Menções</p>
                      <p className="text-xl font-bold text-neon-blue">
                        {platform.mentions.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Sentimento</p>
                      <p className={`text-xl font-bold ${
                        platform.sentiment > 0.6 ? 'text-neon-green' : 'text-yellow-400'
                      }`}>
                        {(platform.sentiment * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Trending:</p>
                    <div className="flex flex-wrap gap-2">
                      {platform.trending.map((topic, i) => (
                        <Badge key={i} variant="outline" className="border-neon-blue text-neon-blue">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">
                🧠 Análise da IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <h4 className="font-semibold text-green-300 mb-2">Padrão Detectado</h4>
                  <p className="text-sm text-green-200">
                    Correlação positiva entre volume de notícias e movimento de preços detectada. 
                    Probabilidade de alta: 68%
                  </p>
                </div>
                
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h4 className="font-semibold text-blue-300 mb-2">Sentimento vs. Preço</h4>
                  <p className="text-sm text-blue-200">
                    Divergência entre sentimento social (72%) e ação do preço sugere oportunidade 
                    de entrada em posições longas.
                  </p>
                </div>
                
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <h4 className="font-semibold text-purple-300 mb-2">Recomendação IA</h4>
                  <p className="text-sm text-purple-200">
                    Baseado na análise de 1.247 fontes de dados, recomendo cautela moderada 
                    com foco em altcoins de DeFi.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewsPanel;
