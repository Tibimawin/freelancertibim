import { collection, doc, setDoc, deleteDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export class FollowService {
  // Seguir um usuário
  static async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new Error('Não pode seguir a si mesmo');
    }

    const followDoc = doc(db, 'follows', `${followerId}_${followingId}`);
    await setDoc(followDoc, {
      followerId,
      followingId,
      createdAt: new Date()
    });
  }

  // Deixar de seguir um usuário
  static async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const followDoc = doc(db, 'follows', `${followerId}_${followingId}`);
    await deleteDoc(followDoc);
  }

  // Verificar se está seguindo
  static async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const followsRef = collection(db, 'follows');
    const q = query(
      followsRef,
      where('followerId', '==', followerId),
      where('followingId', '==', followingId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  // Obter lista de usuários que o usuário está seguindo
  static async getFollowing(userId: string): Promise<string[]> {
    const followsRef = collection(db, 'follows');
    const q = query(followsRef, where('followerId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data().followingId);
  }

  // Obter lista de seguidores
  static async getFollowers(userId: string): Promise<string[]> {
    const followsRef = collection(db, 'follows');
    const q = query(followsRef, where('followingId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data().followerId);
  }

  // Contar seguidores
  static async getFollowersCount(userId: string): Promise<number> {
    const followsRef = collection(db, 'follows');
    const q = query(followsRef, where('followingId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  // Contar seguindo
  static async getFollowingCount(userId: string): Promise<number> {
    const followsRef = collection(db, 'follows');
    const q = query(followsRef, where('followerId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  // Subscribe para mudanças nos seguidores
  static subscribeToFollowers(userId: string, callback: (followers: string[]) => void): () => void {
    const followsRef = collection(db, 'follows');
    const q = query(followsRef, where('followingId', '==', userId));
    
    return onSnapshot(q, (snapshot) => {
      const followers = snapshot.docs.map(doc => doc.data().followerId);
      callback(followers);
    });
  }

  // Subscribe para mudanças em quem está seguindo
  static subscribeToFollowing(userId: string, callback: (following: string[]) => void): () => void {
    const followsRef = collection(db, 'follows');
    const q = query(followsRef, where('followerId', '==', userId));
    
    return onSnapshot(q, (snapshot) => {
      const following = snapshot.docs.map(doc => doc.data().followingId);
      callback(following);
    });
  }
}
