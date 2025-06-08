
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Bot, 
  Shield, 
  DollarSign, 
  Settings,
  TrendingUp,
  AlertTriangle,
  Eye
} from 'lucide-react';

interface TutorialModalProps {
  onComplete: () => void;
  onSkip: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: "Bem-vindo ao Seravat Invest! 🚀",
      icon: <Bot className="w-12 h-12 text-neon-blue" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            O Seravat Invest é um sistema de IA avançado para trading automatizado na Binance.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <h4 className="font-semibold text-blue-300">IA Evolutiva</h4>
              <p className="text-xs text-blue-200">Aprende com o mercado</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
              <h4 className="font-semibold text-green-300">Trading Real</h4>
              <p className="text-xs text-green-200">Conecta com Binance</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Dashboard Principal 📊",
      icon: <TrendingUp className="w-12 h-12 text-neon-green" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            No dashboard você monitora seu saldo, P&L diário e status da IA em tempo real.
          </p>
          <div className="space-y-2">
            <Badge variant="outline" className="border-neon-blue text-neon-blue">
              <DollarSign className="w-4 h-4 mr-2" />
              Saldo em tempo real
            </Badge>
            <Badge variant="outline" className="border-neon-green text-neon-green">
              <TrendingUp className="w-4 h-4 mr-2" />
              P&L do dia
            </Badge>
            <Badge variant="outline" className="border-neon-purple text-neon-purple">
              <Bot className="w-4 h-4 mr-2" />
              Status da IA
            </Badge>
          </div>
        </div>
      )
    },
    {
      title: "Configurações de Risco ⚙️",
      icon: <Shield className="w-12 h-12 text-yellow-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            <strong>IMPORTANTE:</strong> Configure suas credenciais da Binance e parâmetros de risco antes de operar.
          </p>
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <h4 className="font-semibold text-yellow-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Proteções de Segurança
            </h4>
            <ul className="text-sm text-yellow-200 mt-2 space-y-1">
              <li>• Perda máxima diária</li>
              <li>• Risco máximo por trade</li>
              <li>• Stop loss automático</li>
              <li>• Credenciais da Binance</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Modos de Trading 🎯",
      icon: <Settings className="w-12 h-12 text-neon-purple" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Escolha o modo de trading que combina com seu perfil:
          </p>
          <div className="grid gap-3">
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
              <h4 className="font-semibold text-green-300">💎 Conservador</h4>
              <p className="text-xs text-green-200">Baixo risco, retornos estáveis</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <h4 className="font-semibold text-blue-300">⚡ Moderado</h4>
              <p className="text-xs text-blue-200">Equilibrio entre risco e retorno</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
              <h4 className="font-semibold text-red-300">🚀 Agressivo</h4>
              <p className="text-xs text-red-200">Alto risco, altos retornos</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Pronto para começar! 🎉",
      icon: <Eye className="w-12 h-12 text-neon-green" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Agora você pode explorar o sistema! Lembre-se:
          </p>
          <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
            <ul className="text-sm text-gray-300 space-y-2">
              <li>✅ Configure suas credenciais da Binance primeiro</li>
              <li>✅ Defina seus limites de risco</li>
              <li>✅ Escolha um modo de trading</li>
              <li>✅ Monitore os resultados regularmente</li>
            </ul>
          </div>
          <p className="text-xs text-gray-400">
            Você pode reabrir este tutorial nas configurações a qualquer momento.
          </p>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentTutorial = tutorialSteps[currentStep];

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-md cyber-card">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold neon-text">
              Tutorial Seravat
            </DialogTitle>
            <Button
              onClick={onSkip}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex justify-center mb-4">
            {currentTutorial.icon}
          </div>
        </DialogHeader>

        <Card className="cyber-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {currentTutorial.title}
            </h3>
            {currentTutorial.content}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mt-6">
          <Button
            onClick={prevStep}
            disabled={currentStep === 0}
            variant="outline"
            size="sm"
            className="border-gray-600"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          <div className="flex space-x-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-neon-blue' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          <div className="space-x-2">
            <Button
              onClick={onSkip}
              variant="ghost"
              size="sm"
              className="text-gray-400"
            >
              Pular
            </Button>
            <Button
              onClick={nextStep}
              className="cyber-button"
              size="sm"
            >
              {currentStep === tutorialSteps.length - 1 ? 'Finalizar' : 'Próximo'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TutorialModal;
