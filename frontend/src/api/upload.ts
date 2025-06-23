const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface UploadResponse {
  data: Array<{
    filename: string;
    file_id: string;
  }>;
}

export const uploadFilesToBackend = async (files: File[]): Promise<UploadResponse> => {
  try {
    console.log('Enviando arquivos para backend:', files.map(f => f.name));
    
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro no upload: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Resposta do backend:', result);
    
    return result;

  } catch (error) {
    console.error('Erro ao enviar arquivos:', error);
    throw error;
  }
};