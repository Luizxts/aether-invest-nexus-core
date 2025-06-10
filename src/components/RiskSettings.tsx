
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Key, Shield, AlertTriangle, CheckCircle, Loader2, WifiOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RiskSettingsProps {
  settings: {
    max_daily_loss: number;
    max_risk_per_trade: number;
    stop_loss_enabled: boolean;
    ai_level: number;
    trading_mode: string;
    is_trading_active: boolean;
  };
  onSettingsChange: (newSettings: any) => void;
  onCredentialsUpdated?: () => void;
}

const RiskSettings: React.FC<RiskSettingsProps> = ({ 
  settings, 
  onSettingsChange,
  onCredentialsUpdated 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Credentials state
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkExistingCredentials();
    }
  }, [user]);

  const checkExistingCredentials = async () => {
    if (!user) return;

    try {
      const { data: credentials, error } = await supabase
        .from('user_binance_credentials')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!error && credentials && credentials.length > 0) {
        setHasCredentials(true);
        setIsConnected(true);
      } else {
        setHasCredentials(false);
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking credentials:', error);
      setHasCredentials(false);
      setIsConnected(false);
    }
  };

  const validateBinanceCredentials = async (testApiKey: string, testSecretKey: string) => {
    try {
      console.log('Validating credentials...');
      setValidationError(null);
      
      const response = await supabase.functions.invoke('validate-binance-credentials', {
        body: { 
          apiKey: testApiKey.trim(), 
          secretKey: testSecretKey.trim() 
        }
      });

      console.log('Validation response:', response);

      if (response.error) {
        console.error('Edge function error:', response.error);
        throw new Error('Erro interno do servidor. Tente novamente.');
      }

      if (response.data?.error) {
        console.error('Validation failed:', response.data);
        throw new Error(response.data.error);
      }

      if (response.data?.valid) {
        console.log('Validation successful');
        return {
          valid: true,
          accountType: response.data.accountType,
          permissions: response.data.permissions || []
        };
      } else {
        throw new Error('Resposta de validação inválida');
      }
    } catch (error: any) {
      console.error('Validation error:', error);
      throw error;
    }
  };

  const handleSaveCredentials = async () => {
    if (!user || !apiKey.trim() || !secretKey.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha ambas as credenciais da Binance",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      // Validate credentials first
      console.log('Starting credential validation...');
      const validationResult = await validateBinanceCredentials(apiKey.trim(), secretKey.trim());
      
      if (!validationResult.valid) {
        throw new Error('Credenciais inválidas');
      }

      console.log('Credentials valid, saving to database...');

      // Deactivate existing credentials
      await supabase
        .from('user_binance_credentials')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Save new credentials
      const { error: saveError } = await supabase
        .from('user_binance_credentials')
        .insert({
          user_id: user.id,
          api_key_encrypted: apiKey.trim(),
          secret_key_encrypted: secretKey.trim(),
          is_active: true
        });

      if (saveError) {
        console.error('Error saving credentials:', saveError);
        throw new Error('Erro ao salvar credenciais no banco de dados');
      }

      setIsConnected(true);
      setHasCredentials(true);
      setApiKey('');
      setSecretKey('');
      
      toast({
        title: "Credenciais salvas!",
        description: `Conectado com sucesso! Tipo de conta: ${validationResult.accountType}`,
      });

      if (onCredentialsUpdated) {
        onCredentialsUpdated();
      }

    } catch (error: any) {
      console.error('Error in handleSaveCredentials:', error);
      const errorMessage = error.message || 'Erro desconhecido ao validar credenciais';
      setValidationError(errorMessage);
      
      toast({
        title: "Erro de validação",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleDeleteCredentials = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_binance_credentials')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) throw error;

      setIsConnected(false);
      setHasCredentials(false);
      setValidationError(null);
      
      toast({
        title: "Credenciais removidas",
        description: "Suas credenciais da Binance foram desconectadas",
      });

      if (onCredentialsUpdated) {
        onCredentialsUpdated();
      }
    } catch (error) {
      console.error('Error deleting credentials:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover credenciais",
        variant: "destructive",
      });
    }
  };

  const updateSetting = async (key: string, value: any) => {
    if (!user) return;

    try {
      const newSettings = { ...settings, [key]: value };
      
      const { error } = await supabase
        .from('risk_settings')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (!error) {
        onSettingsChange(newSettings);
        toast({
          title: "Configuração atualizada!",
          description: "Suas configurações foram salvas com sucesso",
        });
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar configuração",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Binance Credentials */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-neon-blue" />
            Credenciais Binance
            {isConnected && (
              <Badge variant="outline" className="border-neon-green text-neon-green ml-2">
                <CheckCircle className="w-4 h-4 mr-1" />
                Conectado
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasCredentials ? (
            <>
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-200">
                  <strong>Importante:</strong> Configure suas credenciais com permissão "Spot & Margin Trading" para começar a operar.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key" className="text-gray-300 flex items-center gap-2">
                    <Key size={16} />
                    API Key da Binance
                  </Label>
                  <Input
                    id="api-key"
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="bg-gray-800/50 border-gray-600 text-white font-mono text-sm"
                    placeholder="Cole sua API Key aqui..."
                    disabled={isValidating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secret-key" className="text-gray-300 flex items-center gap-2">
                    <Shield size={16} />
                    Secret Key da Binance
                  </Label>
                  <div className="relative">
                    <Input
                      id="secret-key"
                      type={showSecret ? "text" : "password"}
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      className="bg-gray-800/50 border-gray-600 text-white font-mono text-sm pr-10"
                      placeholder="Cole sua Secret Key aqui..."
                      disabled={isValidating}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      disabled={isValidating}
                    >
                      {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {validationError && (
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <WifiOff className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-200">
                      <strong>Erro:</strong> {validationError}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleSaveCredentials}
                  className="w-full cyber-button"
                  disabled={!apiKey.trim() || !secretKey.trim() || isValidating}
                >
                  {isValidating ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validando credenciais...
                    </div>
                  ) : (
                    'Conectar à Binance'
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-600/10 border border-green-600/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-neon-green" />
                  <span className="text-white">Credenciais configuradas e validadas</span>
                </div>
                <Button 
                  onClick={handleDeleteCredentials}
                  variant="outline"
                  size="sm"
                  className="border-red-500 text-red-400 hover:bg-red-500/10"
                >
                  Desconectar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Management Settings */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">
            ⚡ Gerenciamento de Risco
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-gray-300">Perda Máxima Diária (%)</Label>
            <Slider
              value={[settings.max_daily_loss]}
              onValueChange={(value) => updateSetting('max_daily_loss', value[0])}
              max={20}
              min={1}
              step={0.5}
              className="py-4"
            />
            <div className="text-sm text-gray-400">
              Atual: {settings.max_daily_loss}%
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Risco Máximo por Trade (%)</Label>
            <Slider
              value={[settings.max_risk_per_trade]}
              onValueChange={(value) => updateSetting('max_risk_per_trade', value[0])}
              max={10}
              min={0.5}
              step={0.1}
              className="py-4"
            />
            <div className="text-sm text-gray-400">
              Atual: {settings.max_risk_per_trade}%
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-300">Stop Loss Automático</Label>
              <p className="text-sm text-gray-400">
                Ativar stop loss em todas as operações
              </p>
            </div>
            <Switch
              checked={settings.stop_loss_enabled}
              onCheckedChange={(checked) => updateSetting('stop_loss_enabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Nível da IA</Label>
            <Slider
              value={[settings.ai_level]}
              onValueChange={(value) => updateSetting('ai_level', value[0])}
              max={5}
              min={1}
              step={1}
              className="py-4"
            />
            <div className="text-sm text-gray-400">
              Nível {settings.ai_level}: {
                settings.ai_level === 1 ? 'Conservador' :
                settings.ai_level === 2 ? 'Moderado' :
                settings.ai_level === 3 ? 'Balanceado' :
                settings.ai_level === 4 ? 'Agressivo' : 'Máximo'
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskSettings;
