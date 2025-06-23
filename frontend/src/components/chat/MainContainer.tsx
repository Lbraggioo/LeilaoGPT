import { ReactNode } from "react";

interface MainContainerProps {
  children: ReactNode;
  sidebarExpanded?: boolean;
}

/**
 * Componente utilitário que centraliza o conteúdo principal do chat
 */
export default function MainContainer({ children, sidebarExpanded = true }: MainContainerProps) {
  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-4xl px-6">
        {children}
      </div>
    </div>
  );
}