
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield, AlertTriangle, Key, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RiskSettingsProps {
  settings: {
    maxDailyLoss: number;
    maxRiskPerTrade: number;
    stopLoss: boolean;
  };
  onSettingsChange: (settings: any) => void;
}

const RiskSettings: React.FC<RiskSettingsProps> = ({ settings, onSettingsChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [apiCredentials, setApiCredentials] = useState({
    apiKey: '',
    secretKey: ''
  });
  const [hasCredentials, setHasCredentials] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkExistingCredentials();
  }, [user]);

  const checkExistingCredentials = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_binance_credentials')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      setHasCredentials(!!data && !error);
    } catch (err) {
      setHasCredentials(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!user || !apiCredentials.apiKey || !apiCredentials.secretKey) {
      toast({
        title: "Erro",
        description: "Por favor, preencha API Key e Secret Key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Primeiro, desativar credenciais existentes
      await supabase
        .from('user_binance_credentials')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Inserir novas credenciais
      const { error } = await supabase
        .from('user_binance_credentials')
        .insert({
          user_id: user.id,
          api_key_encrypted: apiCredentials.apiKey,
          secret_key_encrypted: apiCredentials.secretKey,
          is_active: true
        });

      if (error) {
        throw error;
      }

      setHasCredentials(true);
      setApiCredentials({ apiKey: '', secretKey: '' });
      
      toast({
        title: "Sucesso!",
        description: "Credenciais da Binance salvas com sucesso",
      });

    } catch (error) {
      console.error('Erro ao salvar credenciais:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar credenciais. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCredentials = async () => {
    if (!user) return;

    try {
      await supabase
        .from('user_binance_credentials')
        .update({ is_active: false })
        .eq('user_id', user.id);

      setHasCredentials(false);
      
      toast({
        title: "Credenciais removidas",
        description: "Credenciais da Binance foram removidas",
      });

    } catch (error) {
      console.error('Erro ao remover credenciais:', error);
    }
  };

  const updateSettings = (key: string, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* Configuração da API Binance */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Key className="w-6 h-6 text-neon-blue" />
            Credenciais da Binance
            {hasCredentials ? (
              <Badge variant="outline" className="border-neon-green text-neon-green ml-auto">
                <CheckCircle className="w-4 h-4 mr-1" />
                Configurado
              </Badge>
            ) : (
              <Badge variant="outline" className="border-red-500 text-red-500 ml-auto">
                <XCircle className="w-4 h-4 mr-1" />
                Não configurado
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!hasCredentials ? (
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-200">
                Configure suas credenciais da Binance para começar a operar. Sem isso, o robô não pode funcionar.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-200">
                Credenciais configuradas! O robô está pronto para operar.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-gray-300">API Key da Binance</Label>
              <div className="relative">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiCredentials.apiKey}
                  onChange={(e) => setApiCredentials({...apiCredentials, apiKey: e.target.value})}
                  placeholder="Sua API Key da Binance"
                  className="bg-gray-800/50 border-gray-600 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-gray-300">Secret Key da Binance</Label>
              <div className="relative">
                <Input
                  type={showSecretKey ? "text" : "password"}
                  value={apiCredentials.secretKey}
                  onChange={(e) => setApiCredentials({...apiCredentials, secretKey: e.target.value})}
                  placeholder="Sua Secret Key da Binance"
                  className="bg-gray-800/50 border-gray-600 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showSecretKey ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSaveCredentials}
                disabled={isLoading || !apiCredentials.apiKey || !apiCredentials.secretKey}
                className="cyber-button flex-1"
              >
                {isLoading ? 'Salvando...' : 'Salvar Credenciais'}
              </Button>
              
              {hasCredentials && (
                <Button
                  onClick={handleRemoveCredentials}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  Remover
                </Button>
              )}
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <h4 className="font-semibold text-blue-300 mb-2">📋 Como obter suas credenciais:</h4>
              <ol className="text-sm text-blue-200 space-y-1">
                <li>1. Acesse sua conta na Binance</li>
                <li>2. Vá em Perfil → Segurança API</li>
                <li>3. Crie uma nova API Key</li>
                <li>4. Habilite "Spot & Margin Trading"</li>
                <li>5. Cole aqui suas credenciais</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Risco */}
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
