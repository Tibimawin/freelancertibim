import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import { Job } from '@/types/firebase';

export class RecurringJobService {
  /**
   * Calcula a próxima data de publicação baseada na frequência
   */
  static calculateNextPublishDate(
    frequency: 'daily' | 'weekly' | 'monthly',
    interval: number,
    fromDate: Date = new Date()
  ): Date {
    const nextDate = new Date(fromDate);

    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + interval * 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
    }

    return nextDate;
  }

  /**
   * Verifica se uma tarefa recorrente deve ser republicada
   */
  static shouldRepublish(job: Job): boolean {
    if (!job.isRecurring || !job.recurrence?.enabled) {
      return false;
    }

    const { nextPublishDate, endDate, maxRepublications, totalRepublications } =
      job.recurrence;

    // Verifica se atingiu o limite de republicações
    if (
      maxRepublications &&
      totalRepublications &&
      totalRepublications >= maxRepublications
    ) {
      return false;
    }

    // Verifica se passou da data final
    if (endDate && new Date() > endDate) {
      return false;
    }

    // Verifica se chegou a data de publicação
    if (nextPublishDate && new Date() >= nextPublishDate) {
      return true;
    }

    return false;
  }

  /**
   * Busca tarefas recorrentes que precisam ser republicadas
   */
  static async getJobsToRepublish(): Promise<Job[]> {
    const jobsRef = collection(db, 'jobs');
    const q = query(
      jobsRef,
      where('isRecurring', '==', true),
      where('recurrence.enabled', '==', true)
    );

    const snapshot = await getDocs(q);
    const jobs: Job[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const job: Job = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dueDate: data.dueDate?.toDate(),
        recurrence: data.recurrence
          ? {
              ...data.recurrence,
              endDate: data.recurrence.endDate?.toDate(),
              lastPublished: data.recurrence.lastPublished?.toDate(),
              nextPublishDate: data.recurrence.nextPublishDate?.toDate(),
            }
          : undefined,
      } as Job;

      if (this.shouldRepublish(job)) {
        jobs.push(job);
      }
    });

    return jobs;
  }

  /**
   * Republica uma tarefa recorrente
   */
  static async republishJob(originalJob: Job): Promise<string> {
    const jobsRef = collection(db, 'jobs');

    // Cria nova tarefa baseada na original
    const newJobData: any = {
      title: originalJob.title,
      description: originalJob.description,
      posterId: originalJob.posterId,
      posterName: originalJob.posterName,
      bounty: originalJob.bounty,
      platform: originalJob.platform,
      difficulty: originalJob.difficulty,
      category: originalJob.category,
      subcategory: originalJob.subcategory,
      requirements: originalJob.requirements,
      attachments: originalJob.attachments,
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      applicantCount: 0,
      timeEstimate: originalJob.timeEstimate,
      location: originalJob.location,
      maxApplicants: originalJob.maxApplicants,
      dueDate: originalJob.dueDate ? Timestamp.fromDate(originalJob.dueDate) : null,
      detailedInstructions: originalJob.detailedInstructions || [],
      proofRequirements: originalJob.proofRequirements || [],
      posterApprovalRate: originalJob.posterApprovalRate,
      posterRating: originalJob.posterRating,
      youtube: originalJob.youtube,
      tiktok: originalJob.tiktok,
      vk: originalJob.vk,
      website: originalJob.website,
      instagram: originalJob.instagram,
      facebook: originalJob.facebook,
      originalJobId: originalJob.id,
      republicationNumber: (originalJob.republicationNumber || 0) + 1,
      isRecurring: false, // A republicação não herda a recorrência
    };

    const docRef = await addDoc(jobsRef, newJobData);

    // Atualiza a tarefa original com informações de republicação
    const originalJobRef = doc(db, 'jobs', originalJob.id);
    const now = new Date();
    const nextDate = this.calculateNextPublishDate(
      originalJob.recurrence!.frequency,
      originalJob.recurrence!.interval,
      now
    );

    await updateDoc(originalJobRef, {
      'recurrence.lastPublished': Timestamp.fromDate(now),
      'recurrence.nextPublishDate': Timestamp.fromDate(nextDate),
      'recurrence.totalRepublications':
        (originalJob.recurrence?.totalRepublications || 0) + 1,
      updatedAt: Timestamp.now(),
    });

    return docRef.id;
  }

  /**
   * Atualiza configurações de recorrência de uma tarefa
   */
  static async updateRecurrence(
    jobId: string,
    recurrence: Job['recurrence']
  ): Promise<void> {
    const jobRef = doc(db, 'jobs', jobId);
    await updateDoc(jobRef, {
      isRecurring: recurrence?.enabled || false,
      recurrence: recurrence
        ? {
            ...recurrence,
            endDate: recurrence.endDate
              ? Timestamp.fromDate(recurrence.endDate)
              : null,
            lastPublished: recurrence.lastPublished
              ? Timestamp.fromDate(recurrence.lastPublished)
              : null,
            nextPublishDate: recurrence.nextPublishDate
              ? Timestamp.fromDate(recurrence.nextPublishDate)
              : null,
          }
        : null,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Desativa recorrência de uma tarefa
   */
  static async disableRecurrence(jobId: string): Promise<void> {
    const jobRef = doc(db, 'jobs', jobId);
    await updateDoc(jobRef, {
      isRecurring: false,
      'recurrence.enabled': false,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Busca todas as tarefas recorrentes de um usuário
   */
  static async getUserRecurringJobs(userId: string): Promise<Job[]> {
    const jobsRef = collection(db, 'jobs');
    const q = query(
      jobsRef,
      where('posterId', '==', userId),
      where('isRecurring', '==', true)
    );

    const snapshot = await getDocs(q);
    const jobs: Job[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      jobs.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dueDate: data.dueDate?.toDate(),
        recurrence: data.recurrence
          ? {
              ...data.recurrence,
              endDate: data.recurrence.endDate?.toDate(),
              lastPublished: data.recurrence.lastPublished?.toDate(),
              nextPublishDate: data.recurrence.nextPublishDate?.toDate(),
            }
          : undefined,
      } as Job);
    });

    return jobs;
  }
}
