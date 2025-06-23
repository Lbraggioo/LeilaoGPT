import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { useChat } from "@/contexts/chat-context";
import MainContainer from "./MainContainer";
import { QUICK_QUESTIONS } from "@/constants/chat";

interface InitialQuestionsProps {
  sidebarExpanded?: boolean;
}

export default function InitialQuestions({ sidebarExpanded = true }: InitialQuestionsProps) {
  const { sendMessage } = useChat();
  const ask = (q: string) => sendMessage(q);

  return (
    <>
      {/* Background de tela cheia */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-muted/10 to-background" />
      
      {/* Conteúdo centralizado */}
      <div className="flex-1 flex items-center justify-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl px-6"
        >
          {/* Cabeçalho com ícone e texto */}
          <div className="space-y-6 text-center mb-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center shadow-lg"
            >
              <MessageCircle className="h-10 w-10 text-primary" />
            </motion.div>
            <div className="space-y-3">
              <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                Bem-vindo ao LeilãoGPT
              </h3>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Seu assistente inteligente especializado em leilões.
                Escolha uma das perguntas abaixo ou digite a sua.
              </p>
            </div>
          </div>

          {/* Grid de perguntas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {QUICK_QUESTIONS.map((q, idx) => (
              <motion.div
                key={q}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.05 }}
              >
                <Card
                  onClick={() => ask(q)}
                  className="cursor-pointer border-muted hover:border-primary/50 hover:bg-muted/50 transition-all duration-200 group shadow-sm hover:shadow-md"
                >
                  <CardContent className="p-5">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors leading-relaxed">
                      {q}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}