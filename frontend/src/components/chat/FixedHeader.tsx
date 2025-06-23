import ThemeToggle from "@/components/ui/theme-toggle";
import UserMenu from "./user-menu";

/**
 * Header fixo alinhado ao conteúdo principal.
 * Usa a variável CSS global --sidebar-width para acompanhar
 * o estado expandido/colapsado da sidebar.
 */
export default function FixedHeader() {
  return (
    <header
      className="
        fixed top-0 inset-x-0 h-16 z-30
        flex items-center justify-between
        bg-background/90 backdrop-blur-md
        border-b border-border/50 shadow-sm
        px-6
      "
      style={{ 
        paddingLeft: "calc(var(--sidebar-width) + 1.5rem)",
        paddingRight: "1.5rem" 
      }}
    >
      {/* Container para centralizar no mobile */}
      <div className="flex items-center justify-between w-full md:w-auto md:flex-1">
        {/* Título do app - centralizado no mobile */}
        <h1 className="text-xl font-semibold select-none absolute left-1/2 transform -translate-x-1/2 md:relative md:left-auto md:transform-none">
          LeilãoGPT
        </h1>

        {/* Controles no canto direito */}
        <div className="flex items-center gap-2 ml-auto">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}