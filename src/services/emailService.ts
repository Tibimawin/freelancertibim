// Email service usando Firebase Cloud Functions com Resend
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';

export class EmailService {
  private static async callCloudFunction(functionName: string, data: any) {
    try {
      const callable = httpsCallable(functions, functionName);
      const result = await callable(data);
      return result.data;
    } catch (error: any) {
      console.error(`Erro ao chamar função ${functionName}:`, error);
      // Não falhar silenciosamente - apenas logar o erro
      return null;
    }
  }

  static async sendProofApprovedEmail(
    userEmail: string,
    userName: string,
    jobTitle: string,
    amount?: number
  ) {
    return this.callCloudFunction('sendProofApprovedEmail', {
      userEmail,
      userName,
      jobTitle,
      amount
    });
  }

  static async sendProofRejectedEmail(
    userEmail: string,
    userName: string,
    jobTitle: string,
    rejectionReason?: string
  ) {
    return this.callCloudFunction('sendProofRejectedEmail', {
      userEmail,
      userName,
      jobTitle,
      rejectionReason
    });
  }

  static async sendWelcomeEmail(userEmail: string, userName: string) {
    return this.callCloudFunction('sendWelcomeEmail', {
      userEmail,
      userName
    });
  }

  static async sendProofSubmittedEmail(
    posterEmail: string,
    posterName: string,
    workerName: string,
    jobTitle: string,
    proofUrl?: string
  ) {
    return this.callCloudFunction('sendProofSubmittedEmail', {
      posterEmail,
      posterName,
      workerName,
      jobTitle,
      proofUrl
    });
  }

}
