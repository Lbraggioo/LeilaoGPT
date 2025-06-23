import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  X, 
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/utils";

interface FileUploadProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
}

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'success' | 'error';
  progress: number;
  content?: string;
  preview?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  maxFiles = 5,
  maxSize = 10,
  acceptedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ],
  disabled = false
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (type.includes('word') || type.includes('document')) return <FileText className="h-8 w-8 text-blue-500" />;
    if (type.includes('text')) return <File className="h-8 w-8 text-gray-500" />;
    if (type.includes('image')) return <Image className="h-8 w-8 text-green-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return 'Tipo de arquivo não suportado';
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo: ${maxSize}MB`;
    }
    if (files.length >= maxFiles) {
      return `Máximo de ${maxFiles} arquivos permitidos`;
    }
    return null;
  };

  const processFile = async (file: File): Promise<UploadedFile> => {
    const id = Math.random().toString(36).substr(2, 9);
    
    try {
      let content = '';
      let preview = '';

      if (file.type.includes('text')) {
        content = await file.text();
      } else if (file.type.includes('image')) {
        preview = URL.createObjectURL(file);
        content = `Imagem: ${file.name} - Esta imagem foi anexada e será analisada pela IA.`;
      } else if (file.type.includes('pdf')) {
        content = `Documento PDF: ${file.name} (${formatFileSize(file.size)}) - Este documento foi anexado e será analisado pela IA.`;
      } else if (file.type.includes('word') || file.type.includes('document')) {
        content = `Documento Word: ${file.name} (${formatFileSize(file.size)}) - Este documento foi anexado e será analisado pela IA.`;
      }

      return {
        id,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'success',
        progress: 100,
        content,
        preview
      };

    } catch (error) {
      throw new Error(`Erro ao processar ${file.name}: ${error}`);
    }
  };

  const handleFiles = useCallback(async (fileList: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileList.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      try {
        const processedFiles = await Promise.all(
          validFiles.map(processFile)
        );

        setFiles(prev => [...prev, ...processedFiles]);
        onFilesSelected(processedFiles);

      } catch (error) {
        console.error('Erro ao processar arquivos:', error);
        alert('Erro ao processar alguns arquivos. Tente novamente.');
      }
    }
  }, [files.length, maxFiles, maxSize, acceptedTypes, onFilesSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, [handleFiles, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      const successfulFiles = updated.filter(f => f.status === 'success');
      onFilesSelected(successfulFiles);
      return updated;
    });
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
          isDragOver 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-muted-foreground/25 hover:border-muted-foreground/40",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Upload className={cn(
          "mx-auto h-12 w-12 mb-4",
          isDragOver ? "text-primary" : "text-muted-foreground"
        )} />
        
        <div className="space-y-2">
          <p className="text-lg font-medium">
            {isDragOver ? "Solte os arquivos aqui" : "Arraste arquivos ou clique para selecionar"}
          </p>
          <p className="text-sm text-muted-foreground">
            Suporte para PDF, DOCX, TXT, JPG, PNG (máx. {maxSize}MB cada)
          </p>
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || files.length >= maxFiles}
            className="mt-4"
          >
            Selecionar Arquivos
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 border rounded-lg bg-card"
              >
                {getFileIcon(file.type)}
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {file.status === 'success' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file.id)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;