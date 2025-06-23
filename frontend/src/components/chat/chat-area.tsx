import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/contexts/chat-context";
import Message from "./message";
import LoadingDots from "@/components/ui/loading-dots";
import InitialQuestions from "./initial-questions";
import { ChatAvatar } from "@/components/ui/chat-avatar";

interface ChatAreaProps {
  sidebarExpanded?: boolean;
}

export default function ChatArea({ sidebarExpanded = true }: ChatAreaProps) {
  const {
    currentConversation,
    isTyping,
    isCurrentlyTyping,
    displayedTypingContent,
    typingMessage,
  } = useChat();

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  /* Auto-scroll sempre que novas mensagens chegam ou enquanto digita */
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [
    currentConversation?.messages,
    isTyping,
    isCurrentlyTyping,
    displayedTypingContent,
  ]);

  /* Sem mensagens → tela "Bem-vindo" */
  if (!currentConversation || currentConversation.messages.length === 0) {
    return <InitialQuestions sidebarExpanded={sidebarExpanded} />;
  }

  /* ---------------- render normal ---------------- */
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <ScrollArea ref={scrollAreaRef} className="flex-1 h-full">
        {/* Container que ocupa toda altura e centraliza o conteúdo */}
        <div className="w-full h-full flex justify-center pt-20 pb-32">
          {/* Container interno com largura máxima */}
          <div className="w-full max-w-4xl px-6">
            <div className="space-y-6">
              {/* Histórico de mensagens */}
              {currentConversation.messages.map((msg) => (
                <Message key={msg.id} message={msg} />
              ))}

              {/* Indicador de "pensando…" */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <ChatAvatar type="thinking" />
                  <div className="flex-1 max-w-2xl">
                    <div className="bg-muted rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">LeilãoGPT</span>
                        <span className="text-xs text-muted-foreground">
                          Pensando…
                        </span>
                      </div>
                      <LoadingDots />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Conteúdo sendo digitado em tempo real */}
              {typingMessage && isCurrentlyTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-3"
                >
                  <ChatAvatar type="bot" />
                  <div className="flex-1 max-w-2xl">
                    <div className="bg-muted rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">LeilãoGPT</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm leading-relaxed">
                        {/* Remove tags de citação */}
                        {displayedTypingContent.replace(/【[^】]*】/g, "")}
                        {isCurrentlyTyping && (
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.4, repeat: Infinity }}
                            className="inline-block w-0.5 h-4 bg-current ml-0.5"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}