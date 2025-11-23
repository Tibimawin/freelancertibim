import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export class DepositProofService {
  static async uploadProofImage(userId: string, file: File): Promise<string> {
    try {
      // Validar tipo de arquivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo inválido. Use JPG, PNG, WEBP ou PDF.');
      }

      // Validar tamanho (máx 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 5MB');
      }

      // Criar referência única
      const timestamp = Date.now();
      const fileName = `deposit-proof-${userId}-${timestamp}.${file.name.split('.').pop()}`;
      const storageRef = ref(storage, `deposit-proofs/${userId}/${fileName}`);

      // Upload
      await uploadBytes(storageRef, file);

      // Obter URL de download
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading proof:', error);
      throw error;
    }
  }

  static async uploadMultipleProofs(userId: string, files: File[]): Promise<string[]> {
    try {
      const urls: string[] = [];
      
      for (const file of files) {
        const url = await this.uploadProofImage(userId, file);
        urls.push(url);
      }
      
      return urls;
    } catch (error) {
      console.error('Error uploading multiple proofs:', error);
      throw error;
    }
  }
}
