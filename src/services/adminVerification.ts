import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserVerification } from '@/types/admin';

export class AdminVerificationService {
  // Get all pending verifications
  static async getPendingVerifications(limitCount?: number): Promise<UserVerification[]> {
    try {
      let q = query(
        collection(db, 'userVerifications'),
        where('overallStatus', 'in', ['pending', 'incomplete']),
        orderBy('submittedAt', 'asc')
      );

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      const verifications: UserVerification[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        verifications.push({
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate(),
          documents: data.documents?.map((doc: any) => ({
            ...doc,
            uploadedAt: doc.uploadedAt?.toDate() || new Date()
          })) || []
        } as UserVerification);
      });

      return verifications;
    } catch (error) {
      console.error('Error getting pending verifications:', error);
      throw error;
    }
  }

  // Get all verifications (with filters)
  static async getAllVerifications(options?: {
    status?: string;
    limit?: number;
  }): Promise<UserVerification[]> {
    try {
      let q = query(
        collection(db, 'userVerifications'),
        orderBy('submittedAt', 'desc')
      );

      if (options?.status && options.status !== 'all') {
        q = query(q, where('overallStatus', '==', options.status));
      }

      if (options?.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnapshot = await getDocs(q);
      const verifications: UserVerification[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        verifications.push({
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate(),
          documents: data.documents?.map((doc: any) => ({
            ...doc,
            uploadedAt: doc.uploadedAt?.toDate() || new Date()
          })) || []
        } as UserVerification);
      });

      return verifications;
    } catch (error) {
      console.error('Error getting all verifications:', error);
      throw error;
    }
  }

  // Approve user verification
  static async approveVerification(
    verificationId: string,
    adminId: string,
    adminName: string,
    adminNotes?: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      const verificationRef = doc(db, 'userVerifications', verificationId);
      
      // Get verification data
      const verificationDoc = await getDoc(verificationRef);
      if (!verificationDoc.exists()) {
        throw new Error('Verification not found');
      }
      
      const verificationData = verificationDoc.data();

      // Update verification record
      batch.update(verificationRef, {
        overallStatus: 'approved',
        reviewedAt: Timestamp.now(),
        reviewedBy: adminId,
        adminNotes: adminNotes || 'Approved by admin',
        documents: verificationData.documents?.map((doc: any) => ({
          ...doc,
          status: 'approved'
        })) || []
      });

      // Update user record
      const userRef = doc(db, 'users', verificationData.userId);
      batch.update(userRef, {
        verificationStatus: 'approved',
        updatedAt: Timestamp.now()
      });

      // Log the action
      const actionRef = doc(collection(db, 'userActions'));
      batch.set(actionRef, {
        userId: verificationData.userId,
        adminId,
        adminName,
        action: 'verify',
        reason: adminNotes || 'Documents approved',
        createdAt: Timestamp.now()
      });

      await batch.commit();
    } catch (error) {
      console.error('Error approving verification:', error);
      throw error;
    }
  }

  // Reject user verification
  static async rejectVerification(
    verificationId: string,
    adminId: string,
    adminName: string,
    rejectionReasons: { [documentType: string]: string },
    adminNotes?: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      const verificationRef = doc(db, 'userVerifications', verificationId);
      
      // Get verification data
      const verificationDoc = await getDoc(verificationRef);
      if (!verificationDoc.exists()) {
        throw new Error('Verification not found');
      }
      
      const verificationData = verificationDoc.data();

      // Update documents with rejection reasons
      const updatedDocuments = verificationData.documents?.map((doc: any) => ({
        ...doc,
        status: rejectionReasons[doc.type] ? 'rejected' : doc.status,
        rejectionReason: rejectionReasons[doc.type] || doc.rejectionReason
      })) || [];

      // Update verification record
      batch.update(verificationRef, {
        overallStatus: 'rejected',
        reviewedAt: Timestamp.now(),
        reviewedBy: adminId,
        adminNotes: adminNotes || 'Rejected by admin',
        documents: updatedDocuments
      });

      // Update user record
      const userRef = doc(db, 'users', verificationData.userId);
      batch.update(userRef, {
        verificationStatus: 'rejected',
        updatedAt: Timestamp.now()
      });

      await batch.commit();
    } catch (error) {
      console.error('Error rejecting verification:', error);
      throw error;
    }
  }

  // Get verification by ID
  static async getVerificationById(verificationId: string): Promise<UserVerification | null> {
    try {
      const docSnap = await getDoc(doc(db, 'userVerifications', verificationId));
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate(),
          documents: data.documents?.map((doc: any) => ({
            ...doc,
            uploadedAt: doc.uploadedAt?.toDate() || new Date()
          })) || []
        } as UserVerification;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting verification:', error);
      throw error;
    }
  }

  // Get verifications by user ID
  static async getUserVerifications(userId: string): Promise<UserVerification[]> {
    try {
      const q = query(
        collection(db, 'userVerifications'),
        where('userId', '==', userId),
        orderBy('submittedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const verifications: UserVerification[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        verifications.push({
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate(),
          documents: data.documents?.map((doc: any) => ({
            ...doc,
            uploadedAt: doc.uploadedAt?.toDate() || new Date()
          })) || []
        } as UserVerification);
      });

      return verifications;
    } catch (error) {
      console.error('Error getting user verifications:', error);
      throw error;
    }
  }
}