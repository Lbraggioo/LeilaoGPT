import { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useChat } from "@/contexts/chat-context";
import { Send, Paperclip, X, FileText, Image, File, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import FileUpload, { UploadedFile } from "./FileUpload";
import { uploadFilesToBackend } from "@/api/upload";
import MainContainer from "./MainContainer";
import { formatFileSize } from "@/lib/utils";
import { QUICK_QUESTIONS, formatFileContextMessage } from "@/constants/chat";

interface FloatingChatInputProps {
  sidebarExpanded?: boolean;
}

// Hook customizado para gerenciar arquivos
const useFileUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const addFiles = useCallback((files: UploadedFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  const toggleFileUpload = useCallback(() => {
    setShowFileUpload(prev => !prev);
  }, []);

  return {
    uploadedFiles,
    showFileUpload,
    isUploading,
    setIsUploading,
    addFiles,
    removeFile,
    clearFiles,
    toggleFileUpload,
    setShowFileUpload
  };
};

// Hook para gerenciar o estado do chat
const useChatState = () => {
  const [message, setMessage] = useState("");
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const { sendMessage, isTyping, currentConversation } = useChat();

  const hasMessages = useMemo(() => 
    currentConversation && currentConversation.messages.length > 0, 
    [currentConversation]
  );

  const showChatLayout = useMemo(() => 
    hasStartedChat || hasMessages, 
    [hasStartedChat, hasMessages]
  );

  return {
    message,
    setMessage,
    hasStartedChat,
    setHasStartedChat,
    showChatLayout,
    sendMessage,
    isTyping,
    hasMessages
  };
};

// Componente para ícones de arquivo memoizado
const FileIcon = ({ type }: { type: string }) => {
  const icon = useMemo(() => {
    if (type.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
    if (type.includes("word") || type.includes("document")) return <FileText className="h-4 w-4 text-blue-500" />;
    if (type.includes("image")) return <Image className="h-4 w-4 text-green-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  }, [type]);

  return icon;
};

// Componente para preview de arquivos
const FilePreview = ({ files, onRemove }: { files: UploadedFile[], onRemove: (id: string) => void }) => (
  <AnimatePresence>
    {files.length > 0 && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="flex flex-wrap gap-2 justify-center"
      >
        {files.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 px-3 py-2 bg-muted/80 backdrop-blur-sm rounded-full text-sm border border-border/50"
          >
            <FileIcon type={file.type} />
            <span className="truncate max-w-32 font-medium">{file.name}</span>
            <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
              onClick={() => onRemove(file.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
);

// Componente unificado para o input
const ChatInputForm = ({ 
  message, 
  setMessage, 
  onSubmit, 
  uploadedFiles, 
  onToggleFileUpload, 
  showFileUpload, 
  isTyping, 
  isUploading,
  variant = "welcome"
}: {
  message: string;
  setMessage: (msg: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  uploadedFiles: UploadedFile[];
  onToggleFileUpload: () => void;
  showFileUpload: boolean;
  isTyping: boolean;
  isUploading: boolean;
  variant?: "welcome" | "fixed";
}) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit(e);
      }
    },
    [onSubmit]
  );

  const placeholder = useMemo(() => {
    if (uploadedFiles.length > 0) {
      return `Descreva o que você quer saber sobre ${uploadedFiles.length === 1 ? "este arquivo" : "estes arquivos"}...`;
    }
    return "Digite sua mensagem...";
  }, [uploadedFiles.length]);

  const isDisabled = (!message.trim() && uploadedFiles.length === 0) || isTyping || isUploading;

  return (
    <form onSubmit={onSubmit} className="group">
      <div className="bg-background/95 backdrop-blur-md border border-border/60 shadow-2xl overflow-hidden transition-all duration-300 ease-out rounded-full">
        <div className="flex items-center gap-3 transition-all duration-300 px-5 py-3">
          <div className="flex-1 relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                "resize-none border-0 focus-visible:ring-0 bg-transparent text-base transition-all duration-200 leading-relaxed scrollbar-thin outline-none focus:outline-none placeholder:text-muted-foreground/60 text-left placeholder:text-left min-h-[40px]",
                variant === "welcome" ? "max-h-40" : "max-h-32"
              )}
              disabled={isTyping || isUploading}
              rows={1}
              style={{ boxShadow: "none", border: "none", outline: "none", padding: "8px 12px" }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggleFileUpload}
              disabled={isTyping || isUploading}
              className={cn(
                "h-8 w-8 rounded-full transition-all duration-300 ease-out hover:bg-muted/50",
                showFileUpload || uploadedFiles.length > 0 
                  ? "opacity-100 scale-100" 
                  : "opacity-60 group-hover:opacity-100 scale-95 hover:scale-100"
              )}
            >
              <Paperclip className={cn(
                "h-4 w-4 transition-all duration-300",
                showFileUpload 
                  ? "text-primary rotate-45" 
                  : "text-muted-foreground hover:text-foreground"
              )} />
            </Button>
            <Button
              type="submit"
              disabled={isDisabled}
              className={cn(
                "h-8 w-8 rounded-full transition-all duration-300 ease-out",
                isDisabled
                  ? "bg-muted/60 text-muted-foreground cursor-not-allowed opacity-40 scale-95"
                  : "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground scale-100 hover:scale-110 shadow-lg hover:shadow-xl"
              )}
              size="icon"
            >
              {isUploading ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default function FloatingChatInput({ sidebarExpanded = true }: FloatingChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    uploadedFiles,
    showFileUpload,
    isUploading,
    setIsUploading,
    addFiles,
    removeFile,
    clearFiles,
    toggleFileUpload,
    setShowFileUpload
  } = useFileUpload();

  const {
    message,
    setMessage,
    hasStartedChat,
    setHasStartedChat,
    showChatLayout,
    sendMessage,
    isTyping
  } = useChatState();

  // Detecta se é mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Calcula largura da sidebar
  const sidebarWidth = useMemo(() => {
    if (isMobile) return 0;
    return sidebarExpanded ? 280 : 68;
  }, [sidebarExpanded, isMobile]);

  // Envio de mensagem otimizado
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && uploadedFiles.length === 0) return;

    setHasStartedChat(true);
    setShowFileUpload(false);
    setIsUploading(true);

    try {
      let fileIds: string[] = [];
      let contextMessage = message;

      if (uploadedFiles.length > 0) {
        const resp = await uploadFilesToBackend(
          uploadedFiles.map((f) => f.file)
        );
        fileIds = resp.data.map((d: { file_id: string }) => d.file_id);
        contextMessage = formatFileContextMessage(message, uploadedFiles);
      }

      await sendMessage(contextMessage, { fileIds, originalFiles: uploadedFiles });
      setMessage("");
      clearFiles();
    } catch (err: any) {
      console.error(err);
      alert("Erro ao enviar mensagem ou arquivos: " + (err.message || String(err)));
    } finally {
      setIsUploading(false);
    }
  }, [message, uploadedFiles, setHasStartedChat, setShowFileUpload, setIsUploading, sendMessage, setMessage, clearFiles]);

  // Handler para perguntas rápidas
  const handleQuestionClick = useCallback((q: string) => {
    setHasStartedChat(true);
    sendMessage(q);
  }, [sendMessage, setHasStartedChat]);

  // Handler para seleção de arquivos
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: UploadedFile[] = selectedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "success",
      progress: 100,
      content: "",
    }));
    addFiles(newFiles);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [addFiles]);

  // Se há mensagens, só renderiza o input fixo
  if (showChatLayout) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          transition: { type: "spring", stiffness: 300, damping: 25, duration: 0.6 } 
        }}
        className="fixed bottom-0 left-0 right-0 z-20 transition-all duration-300 pb-6 pt-3"
        style={{ paddingLeft: sidebarWidth }} // Adiciona padding baseado na sidebar
      >
        <div className="w-full flex justify-center">
          <div className="w-full max-w-4xl px-6">
            {/* Área de upload compacta */}
            <AnimatePresence>
              {showFileUpload && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: "auto" }} 
                  exit={{ opacity: 0, height: 0 }} 
                  className="mb-4"
                >
                  <div className="bg-background/95 backdrop-blur-md border border-border/60 shadow-xl rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium">Anexar Arquivos</h3>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setShowFileUpload(false)} 
                        className="h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <FileUpload 
                      onFilesSelected={addFiles} 
                      maxFiles={3} 
                      maxSize={10} 
                      disabled={isTyping || isUploading} 
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Preview compacto */}
            <AnimatePresence>
              {uploadedFiles.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: "auto" }} 
                  exit={{ opacity: 0, height: 0 }} 
                  className="flex flex-wrap gap-2 mb-3"
                >
                  {uploadedFiles.map((file) => (
                    <motion.div 
                      key={file.id} 
                      initial={{ opacity: 0, scale: 0.8 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.8 }} 
                      className="flex items-center gap-2 px-3 py-1.5 bg-muted/80 backdrop-blur-sm rounded-full text-xs border border-border/50"
                    >
                      <FileIcon type={file.type} />
                      <span className="truncate max-w-32 font-medium">{file.name}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full" 
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input fixo */}
            <ChatInputForm
              message={message}
              setMessage={setMessage}
              onSubmit={handleSubmit}
              uploadedFiles={uploadedFiles}
              onToggleFileUpload={toggleFileUpload}
              showFileUpload={showFileUpload}
              isTyping={isTyping}
              isUploading={isUploading}
              variant="fixed"
            />
          </div>
        </div>

        {/* Input invisível para fallback de upload */}
        <input 
          ref={fileInputRef} 
          type="file" 
          multiple 
          accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.txt" 
          onChange={handleFileSelect} 
          className="hidden" 
        />
      </motion.div>
    );
  }

  // Tela de boas-vindas (apenas quando não há mensagens)
  return (
    <>
      {/* Background gradient que ocupa toda a tela */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-muted/10 to-background" />
      
      {/* Conteúdo centralizado */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-2">Bem-vindo ao LeilãoGPT</h3>
              <p className="text-muted-foreground">
                Seu assistente inteligente especializado em leilões.
                Escolha uma das perguntas abaixo ou digite sua própria.
              </p>
            </div>
          </div>

          <div className="space-y-6 mt-8">
              {/* Área de upload expandida */}
              <AnimatePresence>
                {showFileUpload && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-muted/20 rounded-xl p-4 border border-border/50 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium">Anexar Arquivos</h3>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setShowFileUpload(false)} 
                        className="h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <FileUpload
                      onFilesSelected={addFiles}
                      maxFiles={3}
                      maxSize={10}
                      disabled={isTyping || isUploading}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Preview de arquivos */}
              <FilePreview files={uploadedFiles} onRemove={removeFile} />

              {/* Formulário principal */}
              <ChatInputForm
                message={message}
                setMessage={setMessage}
                onSubmit={handleSubmit}
                uploadedFiles={uploadedFiles}
                onToggleFileUpload={toggleFileUpload}
                showFileUpload={showFileUpload}
                isTyping={isTyping}
                isUploading={isUploading}
                variant="welcome"
              />

              {/* Perguntas rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {QUICK_QUESTIONS.map((q, i) => (
                  <motion.div 
                    key={q} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <Card 
                      onClick={() => handleQuestionClick(q)} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors group border-muted"
                    >
                      <CardContent className="p-4">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">
                          {q}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
        </motion.div>
      </div>

      {/* Input invisível para fallback de upload */}
      <input 
        ref={fileInputRef} 
        type="file" 
        multiple 
        accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.txt" 
        onChange={handleFileSelect} 
        className="hidden" 
      />
    </>
  );
}