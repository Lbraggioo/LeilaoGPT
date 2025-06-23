import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash, Edit2, Check, X, Plus, ChevronRight, ChevronLeft, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/contexts/chat-context";
import { cn } from "@/lib/utils";

// Hook customizado para gerenciar o estado da sidebar
const useSidebarState = () => {
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startEdit = useCallback((id: number | string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  }, []);

  const commitEdit = useCallback(async (renameConversation: (id: string | number, title: string) => Promise<void>) => {
    if (editingId !== null && editTitle.trim()) {
      await renameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  }, [editingId, editTitle]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditTitle("");
  }, []);

  return {
    editingId,
    editTitle,
    setEditTitle,
    startEdit,
    commitEdit,
    cancelEdit
  };
};

// Componente para item de conversa memoizado
const ConversationItem = ({ 
  conversation, 
  isActive, 
  isEditing, 
  editTitle, 
  onTitleChange, 
  onSelect, 
  onStartEdit, 
  onCommitEdit, 
  onCancelEdit, 
  onDelete 
}: {
  conversation: any;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  onTitleChange: (value: string) => void;
  onSelect: () => void;
  onStartEdit: () => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") onCommitEdit();
    if (e.key === "Escape") onCancelEdit();
  }, [onCommitEdit, onCancelEdit]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "group rounded-lg p-3 transition-all cursor-pointer hover:bg-muted/50 border",
        isActive 
          ? "bg-muted border-border shadow-sm" 
          : "border-border/40 hover:border-border/60 bg-background/50"
      )}
      onClick={onSelect}
    >
      {isEditing ? (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Input
            value={editTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            className="h-8 text-sm"
            autoFocus
            onKeyDown={handleKeyDown}
          />
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCommitEdit}>
            <Check className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCancelEdit}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{conversation.title}</p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              title="Renomear"
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit();
              }}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-destructive hover:text-destructive"
              title="Excluir"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isExpanded: boolean;
  onExpandToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle, isExpanded, onExpandToggle }: SidebarProps) {
  const {
    conversations,
    currentConversation,
    createConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
  } = useChat();

  const {
    editingId,
    editTitle,
    setEditTitle,
    startEdit,
    commitEdit,
    cancelEdit
  } = useSidebarState();

  // Memoiza handlers para evitar re-renders desnecessários
  const handleCreateConversation = useCallback(() => {
    createConversation();
  }, [createConversation]);

  const handleCommitEdit = useCallback(() => {
    commitEdit(renameConversation);
  }, [commitEdit, renameConversation]);

  // Detecta se é mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Animation variants para melhor performance
  const sidebarVariants = useMemo(() => ({
    expanded: { width: 280 },
    collapsed: { width: isMobile ? 0 : 68 }
  }), [isMobile]);

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={isExpanded ? "expanded" : "collapsed"}
        variants={sidebarVariants}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 h-screen bg-background border-r border-border flex flex-col shadow-lg z-50",
          isMobile && !isOpen && "hidden"
        )}
      >
        {isExpanded ? (
          /* Sidebar expandida */
          <>
            {/* Header */}
            <div className="p-3 border-b border-border flex items-center gap-2 h-16 bg-background">
              <Button
                onClick={handleCreateConversation}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:brightness-110 text-sm h-10"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Conversa
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                onClick={isMobile ? onToggle : onExpandToggle}
                className="h-10 w-10 hover:bg-muted/80"
                title={isMobile ? "Fechar menu" : "Recolher sidebar"}
              >
                {isMobile ? <X className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>

            {/* Lista de conversas */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                <AnimatePresence mode="popLayout">
                  {conversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={currentConversation?.id === conversation.id}
                      isEditing={editingId === conversation.id}
                      editTitle={editTitle}
                      onTitleChange={setEditTitle}
                      onSelect={() => {
                        selectConversation(conversation.id);
                        if (isMobile) onToggle();
                      }}
                      onStartEdit={() => startEdit(conversation.id, conversation.title)}
                      onCommitEdit={handleCommitEdit}
                      onCancelEdit={cancelEdit}
                      onDelete={() => deleteConversation(conversation.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </>
        ) : !isMobile ? (
          /* Sidebar recolhida (desktop apenas) */
          <div className="flex flex-col h-full">
            {/* Header recolhido */}
            <div className="p-2 border-b border-border flex flex-col gap-2 h-16 bg-background justify-center">
              <Button
                size="icon"
                variant="ghost"
                onClick={onExpandToggle}
                className="w-12 h-10 hover:bg-muted/80"
                title="Expandir sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Botão Nova Conversa */}
            <div className="p-2 flex flex-col gap-2">
              <Button
                onClick={handleCreateConversation}
                size="icon"
                className="w-12 h-10 bg-gradient-to-r from-primary to-primary/80 hover:brightness-110"
                title="Criar nova conversa"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Lista de conversas recolhida */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:bg-muted/50 border border-transparent hover:border-border/50",
                      currentConversation?.id === conversation.id ? "bg-muted border-border" : ""
                    )}
                    onClick={() => selectConversation(conversation.id)}
                    title={conversation.title}
                  >
                    <span className="text-xs font-medium">
                      {conversation.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : null}
      </motion.aside>
    </>
  );
}