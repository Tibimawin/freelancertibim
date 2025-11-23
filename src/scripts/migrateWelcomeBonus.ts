import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { migrationBackupService } from '@/services/migrationBackupService';

export interface MigrationLog {
  userId: string;
  userName?: string;
  status: 'success' | 'skipped' | 'error';
  reason: string;
  testerBalanceBefore: number;
  posterBonusBefore: number;
  amountMigrated?: number;
  timestamp: Date;
  error?: string;
}

export interface MigrationResult {
  success: boolean;
  migrated: number;
  skipped: number;
  errors: number;
  total: number;
  logs: MigrationLog[];
  startTime: Date;
  endTime: Date;
  duration: number;
  backupId?: string;
}

/**
 * Script de migração para corrigir bônus de boas-vindas creditados incorretamente
 * Move 500 Kz de testerWallet.availableBalance para posterWallet.bonusBalance
 */
export async function migrateWelcomeBonus(adminId: string = 'system', createBackup: boolean = true): Promise<MigrationResult> {
  const startTime = new Date();
  console.log('[Migration] Iniciando migração de bônus de boas-vindas...', startTime.toISOString());
  
  const logs: MigrationLog[] = [];
  
  try {
    // 1. Buscar todos os usuários que receberam o bônus
    const usersQuery = query(
      collection(db, 'users'),
      where('welcomeBonusGrantedAt', '!=', null)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    console.log(`[Migration] Encontrados ${usersSnapshot.size} usuários com bônus concedido`);

    // Criar backup antes da migração (se solicitado)
    let backupId: string | undefined;
    
    if (createBackup) {
      console.log('[Migration] Criando backup antes da migração...');
      const usersToBackup = usersSnapshot.docs
        .filter(doc => {
          const data = doc.data();
          const testerBalance = data?.testerWallet?.availableBalance ?? 0;
          const posterBonusBalance = data?.posterWallet?.bonusBalance ?? 0;
          // Só fazer backup de usuários que serão efetivamente migrados
          return posterBonusBalance < 500 && testerBalance >= 500;
        })
        .map(doc => ({
          userId: doc.id,
          userName: doc.data()?.displayName || doc.data()?.email,
          data: {
            testerWallet: doc.data()?.testerWallet,
            posterWallet: doc.data()?.posterWallet,
            welcomeBonusGrantedAt: doc.data()?.welcomeBonusGrantedAt
          }
        }));

      if (usersToBackup.length > 0) {
        backupId = await migrationBackupService.createBackup(
          'welcome_bonus',
          adminId,
          usersToBackup,
          { bonusAmount: 500 }
        );
        console.log(`[Migration] Backup criado com ID: ${backupId}`);
      } else {
        console.log('[Migration] Nenhum usuário precisa de backup');
      }
    }

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 2. Para cada usuário, verificar e migrar o bônus
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const userName = userData?.displayName || userData?.email || 'Desconhecido';
      
      try {
        const testerBalance = userData?.testerWallet?.availableBalance ?? 0;
        const posterBonusBalance = userData?.posterWallet?.bonusBalance ?? 0;
        
        // Verificar se já foi migrado (posterWallet.bonusBalance >= 500)
        if (posterBonusBalance >= 500) {
          const log: MigrationLog = {
            userId,
            userName,
            status: 'skipped',
            reason: 'Bônus já migrado anteriormente',
            testerBalanceBefore: testerBalance,
            posterBonusBefore: posterBonusBalance,
            timestamp: new Date()
          };
          logs.push(log);
          console.log(`[Migration] ⏭️  Usuário ${userName} (${userId}) já tem bônus migrado (${posterBonusBalance} Kz)`);
          skippedCount++;
          continue;
        }

        // Verificar se tem pelo menos 500 Kz em testerWallet para migrar
        if (testerBalance < 500) {
          const log: MigrationLog = {
            userId,
            userName,
            status: 'skipped',
            reason: `Saldo insuficiente em testerWallet (${testerBalance} Kz)`,
            testerBalanceBefore: testerBalance,
            posterBonusBefore: posterBonusBalance,
            timestamp: new Date()
          };
          logs.push(log);
          console.log(`[Migration] ⏭️  Usuário ${userName} (${userId}) não tem 500 Kz em testerWallet (${testerBalance} Kz)`);
          skippedCount++;
          continue;
        }

        // 3. Migrar: remover 500 de testerWallet e adicionar a posterWallet.bonusBalance
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          'testerWallet.availableBalance': testerBalance - 500,
          'posterWallet.bonusBalance': posterBonusBalance + 500,
          updatedAt: new Date(),
        });

        const log: MigrationLog = {
          userId,
          userName,
          status: 'success',
          reason: 'Migração concluída com sucesso',
          testerBalanceBefore: testerBalance,
          posterBonusBefore: posterBonusBalance,
          amountMigrated: 500,
          timestamp: new Date()
        };
        logs.push(log);
        console.log(`[Migration] ✅ Usuário ${userName} (${userId}) migrado: 500 Kz movidos de testerWallet para posterWallet.bonusBalance`);
        migratedCount++;

      } catch (error) {
        const log: MigrationLog = {
          userId,
          userName,
          status: 'error',
          reason: 'Erro durante a migração',
          testerBalanceBefore: userData?.testerWallet?.availableBalance ?? 0,
          posterBonusBefore: userData?.posterWallet?.bonusBalance ?? 0,
          timestamp: new Date(),
          error: error instanceof Error ? error.message : String(error)
        };
        logs.push(log);
        console.error(`[Migration] ❌ Erro ao migrar usuário ${userName} (${userId}):`, error);
        errorCount++;
      }
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    // Marcar backup como concluído
    if (backupId && migratedCount > 0) {
      await migrationBackupService.markBackupCompleted(backupId);
    }

    console.log('\n[Migration] Migração de bônus concluída!');
    console.log(`✅ Migrados: ${migratedCount}`);
    console.log(`⏭️  Pulados: ${skippedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📊 Total de usuários: ${usersSnapshot.size}`);
    console.log(`⏱️  Duração: ${(duration / 1000).toFixed(2)}s`);

    return {
      success: true,
      migrated: migratedCount,
      skipped: skippedCount,
      errors: errorCount,
      total: usersSnapshot.size,
      logs,
      startTime,
      endTime,
      duration,
      backupId
    };

  } catch (error) {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    console.error('[Migration] Erro fatal na migração:', error);
    
    return {
      success: false,
      migrated: 0,
      skipped: 0,
      errors: 1,
      total: 0,
      logs,
      startTime,
      endTime,
      duration
    };
  }
}

// Função auxiliar para executar via console
if (typeof window !== 'undefined') {
  (window as any).migrateWelcomeBonus = migrateWelcomeBonus;
}
