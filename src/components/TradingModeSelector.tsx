
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, AlertTriangle, Info } from 'lucide-react';

interface TradingModeSelectorProps {
  mode: 'safe' | 'danger';
  onModeChange: (mode: 'safe' | 'danger') => void;
  isTrading: boolean;
}

const TradingModeSelector: React.FC<TradingModeSelectorProps> = ({
  mode,
  onModeChange,
  isTrading
}) => {
  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
          <Info className="w-5 h-5 text-neon-blue" />
          Modo de Trading
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TooltipProvider>
          <div className="grid grid-cols-1 gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={mode === 'safe' ? 'default' : 'outline'}
                  className={`w-full p-4 h-auto flex flex-col items-center gap-2 ${
                    mode === 'safe' 
                      ? 'safe-mode' 
                      : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'
                  } ${isTrading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !isTrading && onModeChange('safe')}
                  disabled={isTrading}
                >
                  <Shield className="w-8 h-8" />
                  <div className="text-center">
                    <p className="font-semibold">Modo Seguro</p>
                    <p className="text-xs opacity-80">Lucros a longo prazo</p>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-2">
                  <p className="font-semibold text-green-400">Modo Seguro</p>
                  <ul className="text-sm space-y-1">
                    <li>• Estratégias conservadoras</li>
                    <li>• Lucros consistentes a longo prazo</li>
                    <li>• Risco baixo de perdas</li>
                    <li>• Ideal para crescimento estável</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={mode === 'danger' ? 'default' : 'outline'}
                  className={`w-full p-4 h-auto flex flex-col items-center gap-2 ${
                    mode === 'danger' 
                      ? 'danger-mode' 
                      : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'
                  } ${isTrading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !isTrading && onModeChange('danger')}
                  disabled={isTrading}
                >
                  <AlertTriangle className="w-8 h-8" />
                  <div className="text-center">
                    <p className="font-semibold">Modo Agressivo</p>
                    <p className="text-xs opacity-80">Lucros rápidos</p>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-2">
                  <p className="font-semibold text-red-400">Modo Agressivo</p>
                  <ul className="text-sm space-y-1">
                    <li>• Estratégias de alto risco</li>
                    <li>• Lucros rápidos potenciais</li>
                    <li>• Maior chance de perdas</li>
                    <li>• Para traders experientes</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <p className="text-xs text-gray-400 text-center">
            {isTrading 
              ? '⚠️ Modo bloqueado durante trading ativo'
              : '💡 Escolha o modo antes de iniciar o trading'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingModeSelector;
