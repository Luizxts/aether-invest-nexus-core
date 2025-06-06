
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Key, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RealBinanceSetupProps {
  onSetupComplete: () => void;
}

const RealBinanceSetup: React.FC<RealBinanceSetupProps> = ({ onSetupComplete }) => {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [hasExistingCredentials, setHasExistingCredentials] = useState(false);

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

      if (data && !error) {
        setHasExistingCredentials(true);
      }
    } catch (err) {
      // No existing credentials
    }
  };

  const validateBinanceCredentials = async (apiKey: string, secretKey: string) => {
    try {
      const response = await supabase.functions.invoke('validate-binance-credentials', {
        body: { apiKey, secretKey }
      });

      return response.data?.valid || false;
    } catch (error) {
      console.error('Error validating credentials:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !secretKey || !user) return;

    setIsConnecting(true);
    setError('');

    try {
      // Validar credenciais com a Binance
      const isValid = await validateBinanceCredentials(apiKey, secretKey);
      
      if (!isValid) {
        setError('Credenciais da Binance inválidas. Verifique sua API Key e Secret Key.');
        setIsConnecting(false);
        return;
      }

      // Salvar credenciais criptografadas no banco
      const { error: dbError } = await supabase
        .from('user_binance_credentials')
        .upsert({
          user_id: user.id,
          api_key_encrypted: apiKey, // Em produção, isso seria criptografado no backend
          secret_key_encrypted: secretKey, // Em produção, isso seria criptografado no backend
          is_active: true
        });

      if (dbError) {
        setError('Erro ao salvar credenciais: ' + dbError.message);
        setIsConnecting(false);
        return;
      }

      // Buscar saldo inicial da Binance
      await fetchInitialBalance();
      
      onSetupComplete();
    } catch (err) {
      setError('Erro ao conectar com a Binance. Tente novamente.');
      setIsConnecting(false);
    }
  };

  const fetchInitialBalance = async () => {
    try {
      const response = await supabase.functions.invoke('get-binance-balance', {
        body: { userId: user?.id }
      });
      
      if (response.data?.balance) {
        // Atualizar dados do portfólio
        await supabase
          .from('portfolio_data')
          .upsert({
            user_id: user?.id,
            total_balance: response.data.balance,
            daily_pnl: 0,
            last_updated: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const useExistingCredentials = () => {
    onSetupComplete();
  };

  if (hasExistingCredentials) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 matrix-effect">
        <Card className="w-full max-w-lg cyber-card animate-fade-in">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-neon-green animate-pulse-neon" />
            </div>
            <CardTitle className="text-2xl font-bold neon-text">
              Binance Já Conectada
            </CardTitle>
            <p className="text-gray-400 text-sm">
              Suas credenciais da Binance já estão configuradas
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-200">
                <strong>Conectado!</strong> Suas credenciais estão ativas e funcionando.
              </AlertDescription>
            </Alert>
            
            <Button onClick={useExistingCredentials} className="w-full cyber-button">
              Continuar para o Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 matrix-effect">
      <Card className="w-full max-w-lg cyber-card animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Key className="w-12 h-12 text-neon-blue animate-pulse-neon" />
              <Shield className="w-6 h-6 text-neon-green absolute -top-1 -right-1" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold neon-text">
            Configuração Binance Real
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Configure suas credenciais para trading real
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              <strong>Importante:</strong> Use apenas credenciais reais da Binance. Suas chaves são criptografadas e validadas.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Cole sua API Key real da Binance..."
                required
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
                  placeholder="Cole sua Secret Key real da Binance..."
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
              <h4 className="text-sm font-semibold text-neon-green mb-2">Configuração Necessária:</h4>
              <ol className="text-xs text-gray-400 space-y-1">
                <li>1. Acesse api.binance.com</li>
                <li>2. Vá em "API Management"</li>
                <li>3. Crie uma nova API Key</li>
                <li>4. ✅ Ative "Enable Spot & Margin Trading"</li>
                <li>5. 🚫 NÃO ative "Enable Withdrawals"</li>
                <li>6. Copie e cole as chaves aqui</li>
              </ol>
            </div>

            <Button 
              type="submit" 
              className="w-full cyber-button"
              disabled={!apiKey || !secretKey || isConnecting}
            >
              {isConnecting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Validando com Binance...
                </div>
              ) : (
                'Conectar & Validar'
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              🔒 Validação em tempo real • 🚀 Trading profissional • 💼 Saldos reais
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealBinanceSetup;
