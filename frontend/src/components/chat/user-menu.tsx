import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import { useChat } from "@/contexts/chat-context";
import { Settings, User, LogOut, Trash2, FileText, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UserMenu = () => {
  const { user, logout } = useAuth();
  const { conversations, deleteConversation } = useChat();
  const { toast } = useToast();
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const handleClearHistory = async () => {
    // Confirma antes de limpar
    if (!window.confirm("Tem certeza que deseja limpar todo o histórico de conversas? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      // Deleta todas as conversas uma por uma
      for (const conversation of conversations) {
        await deleteConversation(conversation.id);
      }
      
      toast({
        title: "Histórico limpo",
        description: "Todas as conversas foram removidas.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível limpar o histórico.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Minha Conta
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem disabled>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.email}</span>
              <span className="text-xs text-muted-foreground">Usuário logado</span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleClearHistory}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar histórico
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setIsTermsOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Termos de uso
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setIsPrivacyOpen(true)}>
            <Shield className="mr-2 h-4 w-4" />
            Política de privacidade
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={logout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sair da conta
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog para termos de uso */}
      <Dialog open={isTermsOpen} onOpenChange={setIsTermsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Termos de Uso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p>
              Ao utilizar o LeilãoGPT, você concorda com os seguintes termos e condições:
            </p>
            <div className="space-y-2">
              <h4 className="font-semibold">1. Uso do Serviço</h4>
              <p>O LeilãoGPT é uma ferramenta de assistência para leilões e deve ser usado apenas para fins informativos.</p>
              
              <h4 className="font-semibold">2. Responsabilidades</h4>
              <p>O usuário é responsável por verificar todas as informações fornecidas pela IA antes de tomar decisões.</p>
              
              <h4 className="font-semibold">3. Limitações</h4>
              <p>O LeilãoGPT não substitui a orientação profissional de um leiloeiro qualificado.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para política de privacidade */}
      <Dialog open={isPrivacyOpen} onOpenChange={setIsPrivacyOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Política de Privacidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p>
              Esta política descreve como coletamos e utilizamos suas informações:
            </p>
            <div className="space-y-2">
              <h4 className="font-semibold">1. Coleta de Dados</h4>
              <p>Coletamos apenas as informações necessárias para o funcionamento do serviço.</p>
              
              <h4 className="font-semibold">2. Uso dos Dados</h4>
              <p>Seus dados são utilizados exclusivamente para melhorar sua experiência no LeilãoGPT.</p>
              
              <h4 className="font-semibold">3. Proteção</h4>
              <p>Implementamos medidas de segurança para proteger suas informações pessoais.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserMenu;