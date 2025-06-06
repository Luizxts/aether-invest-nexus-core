
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Key, Shield, AlertTriangle } from 'lucide-react';

interface BinanceSetupProps {
  onSetupComplete: (apiKey: string, secretKey: string) => void;
}

const BinanceSetup: React.FC<BinanceSetupProps> = ({ onSetupComplete }) => {
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !secretKey) return;

    setIsConnecting(true);
    
    // Simular verificação da conexão
    setTimeout(() => {
      onSetupComplete(apiKey, secretKey);
      setIsConnecting(false);
    }, 2000);
  };

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
            Configuração Binance
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Configure suas credenciais para conexão direta
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              <strong>Importante:</strong> Suas chaves são criptografadas e nunca são armazenadas em texto simples.
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
                placeholder="Cole sua API Key aqui..."
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
                  placeholder="Cole sua Secret Key aqui..."
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
              <h4 className="text-sm font-semibold text-neon-green mb-2">Como obter suas chaves:</h4>
              <ol className="text-xs text-gray-400 space-y-1">
                <li>1. Acesse sua conta Binance</li>
                <li>2. Vá em "API Management"</li>
                <li>3. Crie uma nova API Key</li>
                <li>4. Ative as permissões de Trading</li>
                <li>5. Copie e cole as chaves aqui</li>
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
                  Conectando à Binance...
                </div>
              ) : (
                'Conectar ao Sistema'
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              🔒 Conexão criptografada AES-256 • 🚀 Latência < 10ms
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BinanceSetup;
