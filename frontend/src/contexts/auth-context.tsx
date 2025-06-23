// src/contexts/auth-context.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { api } from "@/lib/api";
import { AuthContextType, User } from "@/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ────────────────────────────────────────────────────────
   Provider
────────────────────────────────────────────────────────── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /* ─── Verifica sessão ao montar ─────────────────────── */
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("leilaogpt-token");
      const email = localStorage.getItem("leilaogpt-email");

      if (token && email) {
        try {
          // Confirma se o token ainda é válido
          await api("/auth/me");               // 401 → vai para catch
          setUser({ email, token });
        } catch {
          clearLocalStorage();
        }
      }
      setIsLoading(false);
    })();
  }, []);

  /* ─── Login ─────────────────────────────────────────── */
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const data = await api<{ token: string; user: { email: string } }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ username: email, password }),
        }
      );

      // Se o backend já configurar cookie HttpOnly, você pode
      // remover o armazenamento abaixo e manter apenas o e-mail.
      localStorage.setItem("leilaogpt-token", data.token);
      localStorage.setItem("leilaogpt-email", data.user.email);
      setUser({ email: data.user.email, token: data.token });
      return true;
    } catch (err) {
      console.error("Falha no login:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── Logout ────────────────────────────────────────── */
  const logout = async () => {
    try {
      // Caso existam refresh-tokens/sessões, invalida no servidor
      await api("/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Falha no logout (servidor):", err);
      // mesmo que falhe, continuamos a limpar localmente
    } finally {
      clearLocalStorage();
      setUser(null);
    }
  };

  /* ─── Helpers ───────────────────────────────────────── */
  const clearLocalStorage = () => {
    localStorage.removeItem("leilaogpt-token");
    localStorage.removeItem("leilaogpt-email");
    localStorage.removeItem("leilaogpt-conversations");
  };

  /* ─── Exporta contexto ──────────────────────────────── */
  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ────────────────────────────────────────────────────────
   Hook de conveniência
────────────────────────────────────────────────────────── */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
