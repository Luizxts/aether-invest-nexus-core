
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, Target, TrendingUp, Activity } from 'lucide-react';

interface AIStatusProps {
  level: number;
  isActive: boolean;
  mode: 'safe' | 'danger';
}

const AIStatus: React.FC<AIStatusProps> = ({ level, isActive, mode }) => {
  const getAIPersonality = (level: number) => {
    if (level < 10) return { name: "Iniciante", color: "text-gray-400" };
    if (level < 25) return { name: "Aprendiz", color: "text-blue-400" };
    if (level < 50) return { name: "Experiente", color: "text-green-400" };
    if (level < 75) return { name: "Especialista", color: "text-purple-400" };
    return { name: "Mestre", color: "text-neon-green" };
  };

  const personality = getAIPersonality(level);

  return (
    <div className="space-y-6">
      {/* Status Principal da IA */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-neon-purple animate-pulse-neon" />
            AETHER - IA Evolutiva
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Status da Consciência</p>
              <p className={`text-lg font-semibold ${personality.color}`}>
                {personality.name} - Nível {level}
              </p>
            </div>
            <Badge 
              variant={isActive ? "default" : "secondary"}
              className={isActive ? "bg-green-600 animate-pulse" : "bg-gray-600"}
            >
              {isActive ? "Ativa" : "Dormindo"}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Evolução Neural</span>
              <span className="text-neon-blue">{level}%</span>
            </div>
            <Progress value={level} className="h-3">
              <div 
                className="h-full bg-gradient-to-r from-neon-blue to-neon-green rounded-full transition-all duration-500"
                style={{ width: `${level}%` }}
              />
            </Progress>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-800/30 rounded-lg">
              <Zap className="w-6 h-6 text-neon-yellow mx-auto mb-2" />
              <p className="text-xs text-gray-400">Velocidade</p>
              <p className="text-sm font-semibold text-white">
                {isActive ? "< 10ms" : "Parada"}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-800/30 rounded-lg">
              <Target className="w-6 h-6 text-neon-green mx-auto mb-2" />
              <p className="text-xs text-gray-400">Precisão</p>
              <p className="text-sm font-semibold text-white">
                {Math.min(85 + level * 0.15, 99).toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-neon-green" />
              Estratégias Aprendidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Scalping</span>
                <span className="text-sm font-semibold text-neon-green">
                  {Math.min(level * 2, 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Swing Trading</span>
                <span className="text-sm font-semibold text-neon-blue">
                  {Math.min(level * 1.5, 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Arbitragem</span>
                <span className="text-sm font-semibold text-neon-purple">
                  {Math.min(level * 1.2, 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-neon-blue" />
              Estado Neural
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Modo Atual</span>
                <Badge 
                  variant="outline"
                  className={mode === 'safe' ? "border-green-500 text-green-400" : "border-red-500 text-red-400"}
                >
                  {mode === 'safe' ? 'Conservador' : 'Agressivo'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Operações Hoje</span>
                <span className="text-sm font-semibold text-white">
                  {Math.floor(Math.random() * 50 + level)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Taxa de Sucesso</span>
                <span className="text-sm font-semibold text-neon-green">
                  {(75 + level * 0.2).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights da IA */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">
            💭 Pensamentos da IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                "Detectando padrão de acumulação em BTC. Probabilidade de alta: 73%"
              </p>
            </div>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-300">
                "Liquidez reduzida detectada. Ajustando tamanho das posições automaticamente."
              </p>
            </div>
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-300">
                "Aprendizado concluído: Nova estratégia de hedge implementada com sucesso."
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIStatus;
