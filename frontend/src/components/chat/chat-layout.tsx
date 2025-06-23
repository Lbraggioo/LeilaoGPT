import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./sidebar";
import ChatArea from "./chat-area";
import FloatingChatInput from "./floating-chat-input";
import FixedHeader from "./FixedHeader";
import CookieBanner from "@/components/ui/cookie-banner";
import { useChat } from "@/contexts/chat-context";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

// Constantes para larguras
const SIDEBAR_WIDTHS = {
  EXPANDED: 280,
  COLLAPSED: 68,
  HIDDEN: 0
} as const;

// Hook para gerenciar o estado da sidebar
const useSidebarState = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detecta se é mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Em mobile, inicia fechado
      if (mobile) {
        setIsOpen(false);
        setIsExpanded(true); // Mobile sempre expandido quando aberto
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const toggleExpanded = useCallback(() => {
    // Mobile não pode recolher, apenas abrir/fechar
    if (!isMobile) {
      setIsExpanded(prev => !prev);
    }
  }, [isMobile]);

  return {
    isOpen,
    isExpanded,
    isMobile,
    toggleOpen,
    toggleExpanded
  };
};

// Hook para calcular largura da sidebar
const useSidebarWidth = (isOpen: boolean, isExpanded: boolean, isMobile: boolean) => {
  return useMemo(() => {
    if (isMobile) {
      return isOpen ? SIDEBAR_WIDTHS.EXPANDED : SIDEBAR_WIDTHS.HIDDEN;
    }
    return isExpanded ? SIDEBAR_WIDTHS.EXPANDED : SIDEBAR_WIDTHS.COLLAPSED;
  }, [isOpen, isExpanded, isMobile]);
};

// Componente para o mobile toggle
const MobileToggle = ({ onToggle }: { onToggle: () => void }) => (
  <Button
    variant="ghost"
    size="icon"
    onClick={onToggle}
    className="fixed left-4 top-4 z-40 bg-background/80 backdrop-blur-sm md:hidden"
  >
    <Menu className="h-4 w-4" />
  </Button>
);

// Componente principal
export default function ChatLayout() {
  const { currentConversation } = useChat();
  const {
    isOpen,
    isExpanded,
    isMobile,
    toggleOpen,
    toggleExpanded
  } = useSidebarState();

  const sidebarWidth = useSidebarWidth(isOpen, isExpanded, isMobile);

  // CSS variables para o layout
  const layoutStyle = useMemo(() => ({
    "--sidebar-width": `${sidebarWidth}px`
  } as React.CSSProperties), [sidebarWidth]);

  // Estado do conteúdo
  const hasMessages = useMemo(() => 
    currentConversation && currentConversation.messages.length > 0,
    [currentConversation]
  );

  return (
    <div className="flex h-screen bg-background" style={layoutStyle}>
      {/* Sidebar */}
      <Sidebar
        isOpen={isOpen}
        onToggle={toggleOpen}
        isExpanded={isExpanded}
        onExpandToggle={toggleExpanded}
      />

      {/* Mobile toggle (quando sidebar está fechada no mobile) */}
      <AnimatePresence>
        {!isOpen && isMobile && (
          <MobileToggle onToggle={toggleOpen} />
        )}
      </AnimatePresence>

      {/* Header fixo */}
      <FixedHeader />

      {/* Área principal */}
      <motion.main
        initial={false}
        animate={{
          marginLeft: 0, // Remove a margem da sidebar
          width: "100vw"
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex flex-col h-screen overflow-hidden relative"
        style={{ paddingLeft: isMobile ? 0 : sidebarWidth }} // Padding ao invés de margin
      >
        {/* Conteúdo baseado no estado */}
        {hasMessages ? (
          <>
            <ChatArea sidebarExpanded={isExpanded} />
            <FloatingChatInput sidebarExpanded={isExpanded} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <FloatingChatInput sidebarExpanded={isExpanded} />
          </div>
        )}
      </motion.main>

      {/* Cookie banner */}
      <CookieBanner />
    </div>
  );
}