
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Key, Shield, AlertTriangle, CheckCircle, Loader2, WifiOff, Info, Copy, Check } from 'lucide-react';
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
  const [helpInstructions, setHelpInstructions] = useState<string | null>(null);
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});

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

  const validateCredentialsFormat = (apiKey: string, secretKey: string): { valid: boolean; error?: string } => {
    // Remove whitespace
    const cleanApiKey = apiKey.trim();
    const cleanSecretKey = secretKey.trim();

    if (!cleanApiKey || !cleanSecretKey) {
      return { valid: false, error: 'Ambas as credenciais são obrigatórias' };
    }

    if (cleanApiKey.length !== 64) {
      return { valid: false, error: `API Key deve ter exatamente 64 caracteres (atual: ${cleanApiKey.length})` };
    }

    if (cleanSecretKey.length !== 64) {
      return { valid: false, error: `Secret Key deve ter exatamente 64 caracteres (atual: ${cleanSecretKey.length})` };
    }

    // Check for valid characters (alphanumeric)
    const validPattern = /^[a-zA-Z0-9]+$/;
    if (!validPattern.test(cleanApiKey)) {
      return { valid: false, error: 'API Key deve conter apenas letras e números (sem espaços ou símbolos)' };
    }

    if (!validPattern.test(cleanSecretKey)) {
      return { valid: false, error: 'Secret Key deve conter apenas letras e números (sem espaços ou símbolos)' };
    }

    return { valid: true };
  };

  const validateBinanceCredentials = async (testApiKey: string, testSecretKey: string) => {
    try {
      console.log('🔄 Starting credential validation...');
      
      const cleanApiKey = testApiKey.trim();
      const cleanSecretKey = testSecretKey.trim();
      
      console.log('📤 Sending validation request to edge function');
      
      const response = await supabase.functions.invoke('validate-binance-credentials', {
        body: { 
          apiKey: cleanApiKey, 
          secretKey: cleanSecretKey 
        }
      });

      console.log('📥 Validation response received:', {
        hasError: !!response.error,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });

      if (response.error) {
        console.error('❌ Edge function error:', response.error);
        throw new Error(`Erro interno: ${response.error.message || 'Falha na comunicação com o servidor'}`);
      }

      if (response.data?.error) {
        console.error('❌ Validation failed:', response.data);
        const error = new Error(response.data.error);
        (error as any).help = response.data.help;
        (error as any).code = response.data.code;
        (error as any).binanceMessage = response.data.binanceMessage;
        throw error;
      }

      if (response.data?.valid) {
        console.log('✅ Validation successful:', {
          accountType: response.data.accountType,
          canTrade: response.data.canTrade,
          permissions: response.data.permissions
        });
        return {
          valid: true,
          accountType: response.data.accountType,
          permissions: response.data.permissions || [],
          canTrade: response.data.canTrade || false
        };
      } else {
        throw new Error('Resposta de validação inválida do servidor');
      }
    } catch (error: any) {
      console.error('❌ Validation error:', error);
      throw error;
    }
  };

  const handleSaveCredentials = async () => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    // Validate credentials format first
    const validation = validateCredentialsFormat(apiKey, secretKey);
    if (!validation.valid) {
      setValidationError(validation.error!);
      toast({
        title: "Formato inválido",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    setHelpInstructions(null);

    try {
      console.log('🚀 Starting credential validation process...');
      
      // Validate credentials with Binance
      const validationResult = await validateBinanceCredentials(apiKey, secretKey);
      
      if (!validationResult.valid) {
        throw new Error('Credenciais inválidas após validação');
      }

      console.log('💾 Credentials valid, saving to database...');

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
        console.error('❌ Error saving credentials:', saveError);
        throw new Error('Erro ao salvar credenciais no banco de dados');
      }

      setIsConnected(true);
      setHasCredentials(true);
      setApiKey('');
      setSecretKey('');
      
      const tradeStatus = validationResult.canTrade ? 'com permissão de trading' : 'somente leitura';
      
      toast({
        title: "✅ Credenciais salvas!",
        description: `Conectado com sucesso! Conta: ${validationResult.accountType} (${tradeStatus})`,
      });

      if (onCredentialsUpdated) {
        onCredentialsUpdated();
      }

    } catch (error: any) {
      console.error('❌ Error in handleSaveCredentials:', error);
      const errorMessage = error.message || 'Erro desconhecido ao validar credenciais';
      setValidationError(errorMessage);
      
      if (error.help) {
        setHelpInstructions(error.help);
      }
      
      toast({
        title: "❌ Erro de validação",
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
      setHelpInstructions(null);
      
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

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ...copied, [key]: true });
      setTimeout(() => {
        setCopied({ ...copied, [key]: false });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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

  const getApiKeyValidationColor = () => {
    if (!apiKey) return 'border-gray-600';
    if (apiKey.length !== 64) return 'border-red-500';
    if (!/^[a-zA-Z0-9]+$/.test(apiKey.trim())) return 'border-red-500';
    return 'border-green-500';
  };

  const getSecretKeyValidationColor = () => {
    if (!secretKey) return 'border-gray-600';
    if (secretKey.length !== 64) return 'border-red-500';
    if (!/^[a-zA-Z0-9]+$/.test(secretKey.trim())) return 'border-red-500';
    return 'border-green-500';
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
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-200">
                  <strong>⚠️ IMPORTANTE - Siga EXATAMENTE estas etapas:</strong>
                  <ol className="mt-3 ml-4 list-decimal text-sm space-y-2">
                    <li><strong>Acesse:</strong> Binance → Login → "Gerenciamento de API"</li>
                    <li><strong>Crie API Key:</strong> "Criar API" → Nome: "Seravat Bot"</li>
                    <li><strong>Permissões obrigatórias:</strong>
                      <div className="ml-4 mt-1">
                        • ✅ "Spot & Margin Trading" (OBRIGATÓRIO)
                        <br />• ✅ "Leitura" (Read) (OBRIGATÓRIO)
                        <br />• ❌ Futures, Options, etc (desnecessário)
                      </div>
                    </li>
                    <li><strong>Restrições de IP:</strong> REMOVER TODAS (deixar lista vazia)</li>
                    <li><strong>Aguardar:</strong> 5-10 minutos após criar/alterar</li>
                    <li><strong>Copiar:</strong> API Key e Secret Key (64 caracteres cada)</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key" className="text-gray-300 flex items-center gap-2">
                    <Key size={16} />
                    API Key da Binance
                  </Label>
                  <div className="relative">
                    <Input
                      id="api-key"
                      type="text"
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        setValidationError(null);
                        setHelpInstructions(null);
                      }}
                      className={`bg-gray-800/50 ${getApiKeyValidationColor()} text-white font-mono text-sm pr-10`}
                      placeholder="Cole sua API Key aqui (64 caracteres)..."
                      disabled={isValidating}
                      maxLength={64}
                    />
                    {apiKey && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(apiKey, 'apiKey')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        disabled={isValidating}
                      >
                        {copied.apiKey ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    )}
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={`${apiKey.length === 64 ? 'text-green-400' : 'text-gray-400'}`}>
                      Caracteres: {apiKey.length}/64
                    </span>
                    {apiKey && (
                      <span className={`${/^[a-zA-Z0-9]+$/.test(apiKey.trim()) ? 'text-green-400' : 'text-red-400'}`}>
                        {/^[a-zA-Z0-9]+$/.test(apiKey.trim()) ? '✓ Formato válido' : '✗ Formato inválido'}
                      </span>
                    )}
                  </div>
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
                      onChange={(e) => {
                        setSecretKey(e.target.value);
                        setValidationError(null);
                        setHelpInstructions(null);
                      }}
                      className={`bg-gray-800/50 ${getSecretKeyValidationColor()} text-white font-mono text-sm pr-20`}
                      placeholder="Cole sua Secret Key aqui (64 caracteres)..."
                      disabled={isValidating}
                      maxLength={64}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                      {secretKey && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(secretKey, 'secretKey')}
                          className="text-gray-400 hover:text-white"
                          disabled={isValidating}
                        >
                          {copied.secretKey ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="text-gray-400 hover:text-white"
                        disabled={isValidating}
                      >
                        {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={`${secretKey.length === 64 ? 'text-green-400' : 'text-gray-400'}`}>
                      Caracteres: {secretKey.length}/64
                    </span>
                    {secretKey && (
                      <span className={`${/^[a-zA-Z0-9]+$/.test(secretKey.trim()) ? 'text-green-400' : 'text-red-400'}`}>
                        {/^[a-zA-Z0-9]+$/.test(secretKey.trim()) ? '✓ Formato válido' : '✗ Formato inválido'}
                      </span>
                    )}
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

                {helpInstructions && (
                  <Alert className="border-yellow-500/50 bg-yellow-500/10">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <AlertDescription className="text-yellow-200">
                      <pre className="whitespace-pre-wrap text-xs font-mono">{helpInstructions}</pre>
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleSaveCredentials}
                  className="w-full cyber-button"
                  disabled={
                    !apiKey.trim() || 
                    !secretKey.trim() || 
                    isValidating || 
                    apiKey.length !== 64 || 
                    secretKey.length !== 64 ||
                    !/^[a-zA-Z0-9]+$/.test(apiKey.trim()) ||
                    !/^[a-zA-Z0-9]+$/.test(secretKey.trim())
                  }
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
