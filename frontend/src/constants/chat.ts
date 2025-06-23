// src/constants/chat.ts

/**
 * Perguntas rápidas exibidas na tela inicial
 */
export const QUICK_QUESTIONS = [
  "Sou iniciante nos leilões, quais dicas você recomenda?",
  "Quais documentos preciso verificar antes de arrematar?",
  "Como saber se um leilão é seguro?",
  "Analisa um edital pra mim?",
] as const;

/**
 * Mensagens do sistema para contexto de arquivos
 */
export const SYSTEM_MESSAGES = {
  fileContext: {
    prefix: "SISTEMA: [ARQUIVOS ANEXADOS PELO USUÁRIO EM",
    instruction: "INSTRUÇÃO: Responda APENAS sobre os arquivos anexados. Utilize arquivos do conhecimento interno apenas para aprimorar sua resposta.",
    userQuestion: "PERGUNTA DO USUÁRIO:",
  }
} as const;

/**
 * Formata a mensagem de contexto para arquivos anexados
 * @param userMessage - Mensagem original do usuário
 * @param files - Array de arquivos anexados
 * @returns Mensagem formatada com contexto
 */
export function formatFileContextMessage(
  userMessage: string,
  files: Array<{ name: string; type: string; size: number }>
): string {
  const currentDateTime = new Date().toLocaleString('pt-BR');
  const filesList = files
    .map(f => `- Nome: ${f.name} (${f.type}, ${formatFileSize(f.size)})`)
    .join('\n');
  
  return `${SYSTEM_MESSAGES.fileContext.prefix} ${currentDateTime}]
${filesList}

${SYSTEM_MESSAGES.fileContext.instruction}

${SYSTEM_MESSAGES.fileContext.userQuestion} ${userMessage}`;
}

// Importe a função formatFileSize para usar aqui
import { formatFileSize } from "@/lib/utils";