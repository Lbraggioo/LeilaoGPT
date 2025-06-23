// src/lib/api.ts
const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

console.log("🔍 API BASE URL:", BASE); // Para verificar

/**
 * Helper central de chamadas REST.
 * - Injeta JWT no header Authorization (quando existir)
 * - Inclui cookies (`credentials: "include"`) p/ quem usar HttpOnly
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

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    // Levanta a string retornada pelo backend como mensagem de erro
    throw new Error(await res.text());
  }

  // Alguns endpoints (ex.: DELETE, logout) devolvem 204 No Content
  if (res.status === 204 || res.headers.get("Content-Length") === "0") {
    return {} as T;
  }

  return (await res.json()) as T;
}