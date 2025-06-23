// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina classes CSS usando clsx e tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata o tamanho do arquivo em uma string legível
 * @param bytes - Tamanho do arquivo em bytes
 * @returns String formatada (ex: "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Retorna as classes CSS apropriadas para o ícone baseado no tipo MIME
 * @param type - Tipo MIME do arquivo
 * @returns String com as classes do ícone
 */
export function getFileIconClass(type: string): string {
  const typeStr = type || "";
  
  if (typeStr.includes('pdf')) {
    return "text-red-500";
  }
  
  if (typeStr.includes('word') || typeStr.includes('document')) {
    return "text-blue-500";
  }
  
  if (typeStr.includes('image')) {
    return "text-green-500";
  }
  
  return "text-gray-500";
}

/**
 * Retorna o tipo de ícone baseado no tipo MIME
 * @param type - Tipo MIME do arquivo
 * @returns 'file-text' | 'image' | 'file'
 */
export function getFileIconType(type: string): 'file-text' | 'image' | 'file' {
  const typeStr = type || "";
  
  if (typeStr.includes('pdf') || typeStr.includes('word') || typeStr.includes('document')) {
    return 'file-text';
  }
  
  if (typeStr.includes('image')) {
    return 'image';
  }
  
  return 'file';
}