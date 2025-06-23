// src/lib/api.ts

// Force production URL since backend is on Railway
const BASE = "https://leilaogpt-production.up.railway.app/api";

console.log("🔍 API BASE URL:", BASE);

/**
 * Helper central de chamadas REST.
 * - Injeta JWT no header Authorization (quando existir)
 * - Converte JSON, mas devolve {} quando o backend responde 204
 */
export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("leilaogpt-token");

  // Detecta se é FormData para não forçar Content-Type
  const isFormData = options.body instanceof FormData;
  
  const headers: HeadersInit = {
    // Só adiciona Content-Type se não for FormData
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });

    // Log para debug
    console.log(`📡 API ${options.method || 'GET'} ${path}: ${res.status}`);

    if (!res.ok) {
      // Tenta pegar mensagem de erro do backend
      let errorMessage = `Erro ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Se não for JSON, tenta texto
        try {
          errorMessage = await res.text() || errorMessage;
        } catch {
          // Usa mensagem padrão
        }
      }
      throw new Error(errorMessage);
    }

    // Alguns endpoints (ex.: DELETE, logout) devolvem 204 No Content
    if (res.status === 204 || res.headers.get("Content-Length") === "0") {
      return {} as T;
    }

    return (await res.json()) as T;
  } catch (error) {
    console.error(`❌ API Error ${path}:`, error);
    throw error;
  }
}