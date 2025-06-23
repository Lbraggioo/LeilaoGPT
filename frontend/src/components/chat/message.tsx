import { motion } from "framer-motion";
import { Message as MessageType } from "@/types";
import { Paperclip, FileText, Image, File, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import FormattedMessage from "./FormattedMessage";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/utils";
import { ChatAvatar } from "@/components/ui/chat-avatar";

interface MessageProps {
  message: MessageType;
}

const Message = ({ message }: MessageProps) => {
  const isUser = message.role === 'user';

  // Agora aceita type opcional para não quebrar ao ler includes
  const getFileIcon = (type?: string) => {
    const t = type ?? "";
    if (t.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (t.includes('word') || t.includes('document')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (t.includes('text')) return <File className="h-4 w-4 text-gray-500" />;
    if (t.includes('image')) return <Image className="h-4 w-4 text-green-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  // Limpa o conteúdo da mensagem removendo a seção de arquivos anexados E instruções do sistema
  const getCleanContent = (content?: string) => {
    if (!content) return '';
    return content
      // Remove instruções do sistema
      .replace(/SISTEMA: \[ARQUIVOS ANEXADOS[\s\S]*?PERGUNTA DO USUÁRIO: /g, '')
      // Remove instruções antigas (fallback)
      .replace(/\[ARQUIVOS ANEXADOS PELO USUÁRIO[\s\S]*?Pergunta do usuário: /g, '')
      // Remove outras instruções do sistema
      .replace(/INSTRUÇÃO: [\s\S]*?PERGUNTA DO USUÁRIO: /g, '')
      // Remove seções de arquivos anexados antigas
      .replace(/\n\n--- ARQUIVOS ANEXADOS ---[\s\S]*?--- FIM DOS ARQUIVOS ---\n\n/g, '')
      .replace(/Por favor, analise os arquivos anexados e responda considerando seu conteúdo\./g, '')
      .trim();
  };

  // Verificações de segurança para evitar erros
  if (!message) {
    return null;
  }

  const messageContent = message.content || '';
  const messageFiles = message.files || [];
  const messageTimestamp = message.timestamp || new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className="flex-shrink-0">
        <ChatAvatar type={isUser ? 'user' : 'bot'} />
      </div>
      
      <div className={cn(
        "flex-1 max-w-2xl",
        isUser ? "flex flex-col items-end" : "flex flex-col items-start"
      )}>
        <div className={cn(
          "rounded-2xl px-4 py-3 shadow-sm",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted"
        )}>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {isUser ? "Você" : "LeilãoGPT"}
            </span>
            <span className="text-xs opacity-70">
              {messageTimestamp.toLocaleTimeString()}
            </span>
            {messageFiles.length > 0 && (
              <span className="text-xs opacity-70 flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                {messageFiles.length} arquivo{messageFiles.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {/* File attachments */}
          {messageFiles.length > 0 && (
            <div className="mt-2 mb-3">
              <p className="text-xs font-medium opacity-70 uppercase tracking-wide mb-2">
                Arquivos anexados
              </p>
              <div className="grid gap-2">
                {messageFiles.map((file, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg border transition-colors",
                      isUser 
                        ? "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/15" 
                        : "bg-background/50 border-border/50 hover:bg-background/70"
                    )}
                  >
                    {getFileIcon(file?.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file?.name || 'Arquivo sem nome'}</p>
                      <p className="text-xs opacity-70">
                        {file?.size ? formatFileSize(file.size) : '0 Bytes'} • {file?.type?.split('/')[1]?.toUpperCase() || 'UNKNOWN'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 hover:opacity-100 transition-opacity"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>  
                ))}
              </div>
            </div>
          )}
          
          {/* Message content */}
          {isUser ? (
            <div className="prose prose-sm max-w-none prose-invert">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {getCleanContent(messageContent)}
              </p>
            </div>
          ) : (
            <FormattedMessage content={getCleanContent(messageContent)} />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Message;