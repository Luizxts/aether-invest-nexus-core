
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  aiLevel: number;
  totalTrades: number;
}

const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  isOpen,
  onClose,
  aiLevel,
  totalTrades
}) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== 'EXCLUIR CONTA' || !user) {
      toast({
        title: "Erro",
        description: "Digite 'EXCLUIR CONTA' exatamente como mostrado",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      // Delete all user data from our tables
      await Promise.all([
        supabase.from('ai_evolution').delete().eq('user_id', user.id),
        supabase.from('trading_operations').delete().eq('user_id', user.id),
        supabase.from('user_binance_credentials').delete().eq('user_id', user.id),
        supabase.from('risk_settings').delete().eq('user_id', user.id),
        supabase.from('portfolio_data').delete().eq('user_id', user.id),
        supabase.from('profiles').delete().eq('id', user.id)
      ]);

      // Sign out and show success message
      await signOut();
      
      toast({
        title: "Conta excluída com sucesso",
        description: "Sua conta e todos os dados foram removidos do sistema",
      });
      
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Erro ao excluir conta",
        description: "Ocorreu um erro. Tente novamente ou entre em contato com o suporte.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="cyber-card max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Excluir Conta Permanentemente
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <h4 className="font-semibold text-red-300 mb-2">⚠️ ATENÇÃO: Esta ação é irreversível!</h4>
              <ul className="text-sm text-red-200 space-y-1">
                <li>• Sua conta será excluída permanentemente</li>
                <li>• Todos os dados de trading serão perdidos</li>
                <li>• <strong>A IA voltará ao nível 1</strong> se você criar uma nova conta</li>
                <li>• Seu progresso atual será perdido:</li>
              </ul>
            </div>
            
            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-600">
              <h5 className="font-semibold text-yellow-300 mb-2">Progresso Atual da IA:</h5>
              <div className="text-sm text-gray-200 space-y-1">
                <div className="flex justify-between">
                  <span>Nível da IA:</span>
                  <span className="text-neon-purple font-bold">Nível {aiLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total de Trades:</span>
                  <span className="text-neon-blue font-bold">{totalTrades}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">
                Para confirmar, digite <code className="bg-gray-700 px-1 rounded text-red-300">EXCLUIR CONTA</code>:
              </Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Digite EXCLUIR CONTA"
                className="bg-gray-800/50 border-red-500/50 text-white"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onClose}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={confirmText !== 'EXCLUIR CONTA' || isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? 'Excluindo...' : 'Excluir Conta'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
