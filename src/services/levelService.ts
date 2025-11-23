import { Application, Job } from '@/types/firebase';
import { ApplicationService } from './applicationService';
import { JobService } from './firebase';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';

export type FreelancerLevelName = 'Inicial' | 'Avançado' | 'Especialista';

export interface LevelBreakdown {
  tasksInitial: number;
  tasksAdvanced: number;
  tasksSpecialized: number;
  excellentCount: number;
  notSatisfiedCount: number;
  spamOrDuplicateCount: number;
  earningsKZ: number;
  inactivityWeeks: number;
}

export interface LevelResult {
  points: number;
  level: FreelancerLevelName;
  levelIndex: 0 | 1 | 2;
  nextLevelAt: number | null; // pontos necessários para próximo nível
  progressToNext: number; // 0-100
  breakdown: LevelBreakdown;
}

const LEVEL_THRESHOLDS = [0, 1000, 3000]; // pontos base para níveis 0,1,2
const KZ_PER_USD = 1000; // ajuste conforme câmbio real disponível
const POINTS_PER_USD = 40;

function levelNameFromIndex(idx: 0 | 1 | 2): FreelancerLevelName {
  return idx === 0 ? 'Inicial' : idx === 1 ? 'Avançado' : 'Especialista';
}

function difficultyToCategory(d: Job['difficulty'] | undefined): 'initial' | 'advanced' | 'specialized' {
  if (d === 'Médio') return 'advanced';
  if (d === 'Difícil') return 'specialized';
  return 'initial';
}

function basePointsForTask(levelIdx: 0 | 1 | 2, category: 'initial' | 'advanced' | 'specialized'): number {
  // Regras fornecidas:
  // - Iniciante concluindo trabalhos iniciais: 30
  // - Avançado concluindo iniciais: 20; avançados: 30
  // - Especialista concluindo iniciais: 10; avançados: 20; especializados: 30
  if (levelIdx === 0) {
    return category === 'initial' ? 30 : 20;
  }
  if (levelIdx === 1) {
    return category === 'initial' ? 20 : 30;
  }
  // Especialista
  return category === 'initial' ? 10 : category === 'advanced' ? 20 : 30;
}

function levelIndexFromPoints(points: number): 0 | 1 | 2 {
  if (points >= LEVEL_THRESHOLDS[2]) return 2;
  if (points >= LEVEL_THRESHOLDS[1]) return 1;
  return 0;
}

export class LevelService {
  static async getUserLevel(userId: string): Promise<LevelResult> {
    const apps = await ApplicationService.getUserApplications(userId);
    // Ordena cronologicamente para simular evolução por tempo
    const ordered = apps.slice().sort((a, b) => new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime());

    let points = 0;
    let levelIdx: 0 | 1 | 2 = 0; // começa em Nível 0 (Inicial)

    let tasksInitial = 0;
    let tasksAdvanced = 0;
    let tasksSpecialized = 0;
    let excellentCount = 0;
    let notSatisfiedCount = 0;
    let spamOrDuplicateCount = 0; // sem fonte confiável por enquanto
    let earningsKZ = 0;

    let lastApprovedAt: Date | null = null;

    for (const app of ordered) {
      if (app.status !== 'approved') continue;

      const job: Job | null = await JobService.getJobById(app.jobId);
      const category = difficultyToCategory(job?.difficulty);
      if (category === 'initial') tasksInitial += 1;
      else if (category === 'advanced') tasksAdvanced += 1;
      else tasksSpecialized += 1;

      // Pontos base pelo combo nível atual x categoria da tarefa
      const base = basePointsForTask(levelIdx, category);

      // Bonus por tarefa excelente (rating 5 ou feedback semelhante)
      const isExcellent = (app.feedback?.rating || 0) >= 5;
      const earnedBase = isExcellent ? base * 1.5 : base;
      if (isExcellent) excellentCount += 1;

      // Ganhos: considerar bounty em KZ -> USD -> pontos
      const bountyKZ = (job?.bounty || 0);
      earningsKZ += bountyKZ;
      const earnedFromMoney = Math.round((bountyKZ / KZ_PER_USD) * POINTS_PER_USD);

      points += earnedBase + earnedFromMoney;

      // Penalidade por Não Satisfeito (rating <= 2)
      const notSatisfied = (app.feedback?.rating || 0) > 0 && (app.feedback?.rating || 0) <= 2;
      if (notSatisfied) {
        points -= 50 * (levelIdx + 1);
        notSatisfiedCount += 1;
      }

      // A cada conclusão, recalcular nível pelo total acumulado
      levelIdx = levelIndexFromPoints(points);
      lastApprovedAt = app.reviewedAt ? new Date(app.reviewedAt as any) : new Date(app.appliedAt as any);
    }

    // Penalidade por inatividade semanal desde a última aprovação
    let inactivityWeeks = 0;
    if (lastApprovedAt) {
      const diffMs = Date.now() - lastApprovedAt.getTime();
      inactivityWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
      if (inactivityWeeks > 0) {
        points -= inactivityWeeks * (100 * (levelIdx + 1));
      }
    }

    if (points < 0) points = 0;

    // Próximo nível
    const nextLevelIdx = Math.min(2, (levelIdx + 1) as 0 | 1 | 2);
    const nextAt = levelIdx === 2 ? null : LEVEL_THRESHOLDS[nextLevelIdx];
    const progress = nextAt ? Math.max(0, Math.min(100, Math.round((points - LEVEL_THRESHOLDS[levelIdx]) / (nextAt - LEVEL_THRESHOLDS[levelIdx]) * 100))) : 100;

    return {
      points,
      level: levelNameFromIndex(levelIdx),
      levelIndex: levelIdx,
      nextLevelAt: nextAt,
      progressToNext: progress,
      breakdown: {
        tasksInitial,
        tasksAdvanced,
        tasksSpecialized,
        excellentCount,
        notSatisfiedCount,
        spamOrDuplicateCount,
        earningsKZ,
        inactivityWeeks,
      },
    };
  }

  // Novo sistema de XP persistido no banco
  static async getUserXP(userId: string): Promise<{ xp: number; level: number }> {
    try {
      const userLevelRef = doc(db, 'user_levels', userId);
      const userLevelSnap = await getDoc(userLevelRef);
      
      if (userLevelSnap.exists()) {
        const data = userLevelSnap.data();
        return {
          xp: data.xp || 0,
          level: data.level || 0
        };
      }
      
      // Criar documento inicial se não existir
      await setDoc(userLevelRef, {
        xp: 0,
        level: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return { xp: 0, level: 0 };
    } catch (error) {
      console.error('Error getting user XP:', error);
      return { xp: 0, level: 0 };
    }
  }

  static async addXP(userId: string, xpAmount: number, reason: string): Promise<{ xp: number; level: number; leveledUp: boolean }> {
    try {
      const userLevelRef = doc(db, 'user_levels', userId);
      const userLevelSnap = await getDoc(userLevelRef);
      
      let currentXP = 0;
      let currentLevel = 0;
      
      if (userLevelSnap.exists()) {
        const data = userLevelSnap.data();
        currentXP = data.xp || 0;
        currentLevel = data.level || 0;
      }
      
      const newXP = currentXP + xpAmount;
      const newLevel = this.calculateLevelFromXP(newXP);
      const leveledUp = newLevel > currentLevel;
      
      if (userLevelSnap.exists()) {
        await updateDoc(userLevelRef, {
          xp: increment(xpAmount),
          level: newLevel,
          lastXPReason: reason,
          lastXPAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      } else {
        await setDoc(userLevelRef, {
          xp: xpAmount,
          level: newLevel,
          lastXPReason: reason,
          lastXPAt: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
      
      return { xp: newXP, level: newLevel, leveledUp };
    } catch (error) {
      console.error('Error adding XP:', error);
      throw error;
    }
  }

  static calculateLevelFromXP(xp: number): number {
    // Níveis baseados em XP:
    // Nível 0: 0-99 XP
    // Nível 1: 100-299 XP
    // Nível 2: 300-599 XP
    // Nível 3: 600-999 XP
    // Nível 4: 1000-1499 XP
    // Nível 5+: 1500+ XP (cada 500 XP = 1 nível)
    
    if (xp < 100) return 0;
    if (xp < 300) return 1;
    if (xp < 600) return 2;
    if (xp < 1000) return 3;
    if (xp < 1500) return 4;
    
    return 5 + Math.floor((xp - 1500) / 500);
  }

  static getXPForNextLevel(currentXP: number): number {
    const currentLevel = this.calculateLevelFromXP(currentXP);
    
    // XP necessário para o próximo nível
    if (currentLevel === 0) return 100;
    if (currentLevel === 1) return 300;
    if (currentLevel === 2) return 600;
    if (currentLevel === 3) return 1000;
    if (currentLevel === 4) return 1500;
    
    return 1500 + ((currentLevel - 4) * 500);
  }

  static getLevelName(level: number): string {
    if (level === 0) return 'Iniciante';
    if (level === 1) return 'Bronze';
    if (level === 2) return 'Prata';
    if (level === 3) return 'Ouro';
    if (level === 4) return 'Platina';
    if (level === 5) return 'Diamante';
    if (level === 6) return 'Mestre';
    if (level >= 7) return 'Lendário';
    return 'Iniciante';
  }

  static maxAllowedBountyKZ(levelIdx: 0 | 1 | 2): number {
    // Regra simplificada: quanto maior o nível, maior o valor acessível
    if (levelIdx === 0) return 1000; // Inicial
    if (levelIdx === 1) return 5000; // Avançado
    return Number.POSITIVE_INFINITY; // Especialista
  }
}