import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';
import { LevelService } from '@/services/levelService';

/**
 * Script de migração para popular retroativamente a coleção user_levels
 * baseado no histórico de aplicações e avaliações dos usuários
 */
export async function migrateUserLevels() {
  console.log('[Migration] Iniciando migração de user_levels...');
  
  try {
    // 1. Buscar todos os usuários
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`[Migration] Encontrados ${usersSnapshot.size} usuários`);

    let processedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // 2. Para cada usuário, processar aplicações
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      try {
        // Verificar se já existe registro em user_levels
        const existingLevel = await LevelService.getUserXP(userId);
        
        if (existingLevel.xp > 0) {
          console.log(`[Migration] Usuário ${userId} já tem XP (${existingLevel.xp}), pulando...`);
          skippedCount++;
          continue;
        }

        // Buscar todas as aplicações aprovadas do usuário
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('applicantId', '==', userId),
          where('status', '==', 'approved')
        );
        
        const applicationsSnapshot = await getDocs(applicationsQuery);
        
        if (applicationsSnapshot.empty) {
          console.log(`[Migration] Usuário ${userId} sem aplicações aprovadas, pulando...`);
          skippedCount++;
          continue;
        }

        let totalXP = 0;
        const transactions: Array<{ xp: number; reason: string; timestamp: Date }> = [];

        // 3. Calcular XP baseado em aplicações
        for (const appDoc of applicationsSnapshot.docs) {
          const application = appDoc.data();
          
          // XP por tarefa completada (base: 10 XP)
          const taskXP = 10;
          totalXP += taskXP;
          transactions.push({
            xp: taskXP,
            reason: `Tarefa completada (migração): ${application.jobTitle || 'Tarefa'}`,
            timestamp: application.approvedAt?.toDate() || new Date()
          });

          // XP por avaliação recebida
          if (application.feedback?.rating) {
            const rating = application.feedback.rating;
            if (rating >= 4) {
              const feedbackXP = 5; // 5 XP por feedback bom
              totalXP += feedbackXP;
              transactions.push({
                xp: feedbackXP,
                reason: `Feedback excelente (${rating}★) - migração`,
                timestamp: application.feedback.createdAt?.toDate() || new Date()
              });
            }
          }

          // XP por fazer avaliação
          if (application.contractorFeedback?.rating) {
            const evaluationXP = 3; // 3 XP por avaliar
            totalXP += evaluationXP;
            transactions.push({
              xp: evaluationXP,
              reason: 'Avaliação de tarefa (migração)',
              timestamp: application.contractorFeedback.createdAt?.toDate() || new Date()
            });
          }
        }

        if (totalXP === 0) {
          console.log(`[Migration] Usuário ${userId} sem XP calculado, pulando...`);
          skippedCount++;
          continue;
        }

        // 4. Calcular nível baseado no XP total
        const level = LevelService.calculateLevelFromXP(totalXP);
        const levelName = LevelService.getLevelName(level);

        // Pegar a data da última atividade (última aplicação aprovada)
        const lastActivity = applicationsSnapshot.docs
          .map(doc => doc.data().approvedAt?.toDate() || new Date())
          .sort((a, b) => b.getTime() - a.getTime())[0];

        // 5. Criar documento em user_levels
        const userLevelRef = doc(db, 'user_levels', userId);
        await setDoc(userLevelRef, {
          xp: totalXP,
          level,
          levelName,
          lastXPAt: lastActivity,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // 6. Criar histórico de transações
        const xpHistoryRef = collection(db, `user_levels/${userId}/xp_history`);
        for (const transaction of transactions) {
          await setDoc(doc(xpHistoryRef), {
            xp: transaction.xp,
            reason: transaction.reason,
            timestamp: transaction.timestamp
          });
        }

        console.log(`[Migration] ✅ Usuário ${userId} migrado: ${totalXP} XP, Nível ${level} (${levelName}), ${transactions.length} transações`);
        processedCount++;

      } catch (error) {
        console.error(`[Migration] ❌ Erro ao processar usuário ${userId}:`, error);
        errorCount++;
      }
    }

    console.log('\n[Migration] Migração concluída!');
    console.log(`✅ Processados: ${processedCount}`);
    console.log(`⏭️  Pulados: ${skippedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📊 Total de usuários: ${usersSnapshot.size}`);

    return {
      success: true,
      processed: processedCount,
      skipped: skippedCount,
      errors: errorCount,
      total: usersSnapshot.size
    };

  } catch (error) {
    console.error('[Migration] Erro fatal na migração:', error);
    throw error;
  }
}

// Função auxiliar para executar via console
if (typeof window !== 'undefined') {
  (window as any).migrateUserLevels = migrateUserLevels;
}
