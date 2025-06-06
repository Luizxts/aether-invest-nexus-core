
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Shield, AlertTriangle } from 'lucide-react';

interface RiskSettingsProps {
  settings: {
    maxDailyLoss: number;
    maxRiskPerTrade: number;
    stopLoss: boolean;
  };
  onSettingsChange: (settings: any) => void;
}

const RiskSettings: React.FC<RiskSettingsProps> = ({ settings, onSettingsChange }) => {
  const updateSettings = (key: string, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="space-y-6">
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-neon-blue" />
            Configurações de Risco
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              Estas configurações controlam o comportamento da IA e são fundamentais para proteger seu capital.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-gray-300 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Perda Máxima Diária: {settings.maxDailyLoss}%
              </Label>
              <Slider
                value={[settings.maxDailyLoss]}
                onValueChange={(value) => updateSettings('maxDailyLoss', value[0])}
                max={20}
                min={1}
                step={0.5}
                className="w-full"
              />
              <p className="text-xs text-gray-400">
                A IA parará todas as operações se atingir esta perda
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-gray-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Risco Máximo por Trade: {settings.maxRiskPerTrade}%
              </Label>
              <Slider
                value={[settings.maxRiskPerTrade]}
                onValueChange={(value) => updateSettings('maxRiskPerTrade', value[0])}
                max={10}
                min={0.5}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-gray-400">
                Percentual máximo do capital em cada operação
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
              <div>
                <Label className="text-gray-300">Stop Loss Automático</Label>
                <p className="text-xs text-gray-400">
                  Ativar stop loss inteligente em todas as posições
                </p>
              </div>
              <Switch
                checked={settings.stopLoss}
                onCheckedChange={(checked) => updateSettings('stopLoss', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações Avançadas */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">
            ⚙️ Configurações Avançadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
              <h4 className="font-semibold text-white mb-2">Alavancagem Máxima</h4>
              <p className="text-2xl font-bold text-neon-blue">5x</p>
              <p className="text-xs text-gray-400">Ajustada automaticamente pela IA</p>
            </div>
            
            <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
              <h4 className="font-semibold text-white mb-2">Timeout de Posição</h4>
              <p className="text-2xl font-bold text-neon-green">2h</p>
              <p className="text-xs text-gray-400">Tempo máximo em uma posição</p>
            </div>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="font-semibold text-blue-300 mb-2">🛡️ Proteções Ativas</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Anti-liquidação inteligente</li>
              <li>• Detecção de manipulação de mercado</li>
              <li>• Sistema de circuit breaker</li>
              <li>• Backup automático de estratégias</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskSettings;
