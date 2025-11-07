import axios from 'axios';

// Credenciais seguras para o frontend (Cloud Name e API Key)
const CLOUD_NAME = "frelincer"; // Usar minúsculas para garantir consistência no URL
const UPLOAD_PRESET = "chat_uploads"; // Corrigido para o preset não assinado existente
// Deve ser um preset unsigned

export interface UploadResult {
  url: string;
  public_id: string;
}

export class CloudinaryService {
  private static getUploadUrl(): string {
    return `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  }

  /**
   * Faz o upload de um arquivo para o Cloudinary usando um preset não assinado.
   * @param file O arquivo a ser enviado (File object).
   * @param folder A subpasta dentro do Cloudinary (ex: 'verifications/userId').
   * @returns URL e Public ID do arquivo.
   */
  static async uploadFile(file: File, folder: string): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folder);

    try {
      const response = await axios.post(this.getUploadUrl(), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        url: response.data.secure_url,
        public_id: response.data.public_id,
      };
    } catch (error: any) {
      console.error('Erro ao fazer upload para o Cloudinary:', error);
      
      // Adicionar log detalhado da resposta 400
      if (error.response) {
        console.error('Detalhes do Erro Cloudinary (400):', error.response.data);
        throw new Error(`Falha no upload do documento: ${error.response.data.error?.message || 'Verifique o Cloud Name e o Upload Preset.'}`);
      }
      
      throw new Error('Falha no upload do documento.');
    }
  }
}