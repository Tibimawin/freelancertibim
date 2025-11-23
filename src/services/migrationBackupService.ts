import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, orderBy, limit, Timestamp } from 'firebase/firestore';

export interface MigrationBackup {
  id?: string;
  migrationType: 'welcome_bonus' | 'user_levels' | string;
  createdAt: Date;
  createdBy: string;
  affectedUsers: Array<{
    userId: string;
    userName?: string;
    snapshot: any; // Dados originais do usuário
  }>;
  migrationParams?: any;
  status: 'pending' | 'completed' | 'rolled_back';
  completedAt?: Date;
  rolledBackAt?: Date;
  rolledBackBy?: string;
}

export interface RollbackResult {
  success: boolean;
  restored: number;
  errors: number;
  errorDetails: Array<{
    userId: string;
    error: string;
  }>;
}

class MigrationBackupService {
  private backupsCollection = 'migration_backups';

  /**
   * Cria um backup antes da migração
   */
  async createBackup(
    migrationType: string,
    adminId: string,
    usersToBackup: Array<{ userId: string; userName?: string; data: any }>,
    migrationParams?: any
  ): Promise<string> {
    try {
      const backup: MigrationBackup = {
        migrationType,
        createdAt: new Date(),
        createdBy: adminId,
        affectedUsers: usersToBackup.map(u => ({
          userId: u.userId,
          userName: u.userName,
          snapshot: u.data
        })),
        migrationParams,
        status: 'pending'
      };

      const docRef = await addDoc(collection(db, this.backupsCollection), backup);
      console.log(`[Backup] Backup criado com ID: ${docRef.id}`);
      
      return docRef.id;
    } catch (error) {
      console.error('[Backup] Erro ao criar backup:', error);
      throw error;
    }
  }

  /**
   * Marca um backup como concluído
   */
  async markBackupCompleted(backupId: string): Promise<void> {
    try {
      const backupRef = doc(db, this.backupsCollection, backupId);
      await updateDoc(backupRef, {
        status: 'completed',
        completedAt: new Date()
      });
      console.log(`[Backup] Backup ${backupId} marcado como concluído`);
    } catch (error) {
      console.error('[Backup] Erro ao marcar backup como concluído:', error);
      throw error;
    }
  }

  /**
   * Executa rollback de uma migração
   */
  async performRollback(backupId: string, adminId: string): Promise<RollbackResult> {
    console.log(`[Rollback] Iniciando rollback do backup ${backupId}`);
    
    const result: RollbackResult = {
      success: false,
      restored: 0,
      errors: 0,
      errorDetails: []
    };

    try {
      // Buscar o backup
      const backupRef = doc(db, this.backupsCollection, backupId);
      const backupSnapshot = await getDocs(query(collection(db, this.backupsCollection)));
      
      const backupDoc = backupSnapshot.docs.find(d => d.id === backupId);
      if (!backupDoc) {
        throw new Error('Backup não encontrado');
      }

      const backup = backupDoc.data() as MigrationBackup;
      
      if (backup.status === 'rolled_back') {
        throw new Error('Este backup já foi revertido anteriormente');
      }

      // Restaurar cada usuário
      for (const user of backup.affectedUsers) {
        try {
          const userRef = doc(db, 'users', user.userId);
          await updateDoc(userRef, {
            ...user.snapshot,
            updatedAt: new Date()
          });
          
          console.log(`[Rollback] Usuário ${user.userId} restaurado com sucesso`);
          result.restored++;
        } catch (error) {
          console.error(`[Rollback] Erro ao restaurar usuário ${user.userId}:`, error);
          result.errors++;
          result.errorDetails.push({
            userId: user.userId,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      // Marcar backup como revertido
      await updateDoc(backupRef, {
        status: 'rolled_back',
        rolledBackAt: new Date(),
        rolledBackBy: adminId
      });

      result.success = true;
      console.log(`[Rollback] Rollback concluído: ${result.restored} restaurados, ${result.errors} erros`);
      
      return result;
    } catch (error) {
      console.error('[Rollback] Erro fatal durante rollback:', error);
      result.errorDetails.push({
        userId: 'SYSTEM',
        error: error instanceof Error ? error.message : String(error)
      });
      return result;
    }
  }

  /**
   * Lista todos os backups disponíveis
   */
  async listBackups(limitCount: number = 50): Promise<MigrationBackup[]> {
    try {
      const backupsQuery = query(
        collection(db, this.backupsCollection),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(backupsQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
        completedAt: doc.data().completedAt ? (doc.data().completedAt as Timestamp).toDate() : undefined,
        rolledBackAt: doc.data().rolledBackAt ? (doc.data().rolledBackAt as Timestamp).toDate() : undefined,
      })) as MigrationBackup[];
    } catch (error) {
      console.error('[Backup] Erro ao listar backups:', error);
      throw error;
    }
  }

  /**
   * Obtém detalhes de um backup específico
   */
  async getBackupDetails(backupId: string): Promise<MigrationBackup | null> {
    try {
      const backupsSnapshot = await getDocs(collection(db, this.backupsCollection));
      const backupDoc = backupsSnapshot.docs.find(d => d.id === backupId);
      
      if (!backupDoc) {
        return null;
      }

      const data = backupDoc.data();
      return {
        id: backupDoc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
        completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined,
        rolledBackAt: data.rolledBackAt ? (data.rolledBackAt as Timestamp).toDate() : undefined,
      } as MigrationBackup;
    } catch (error) {
      console.error('[Backup] Erro ao obter detalhes do backup:', error);
      throw error;
    }
  }
}

export const migrationBackupService = new MigrationBackupService();
