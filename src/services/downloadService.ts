import { db } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { MarketDownloadToken } from '@/types/firebase';

export class DownloadService {
  static tokensCollection() {
    return collection(db, 'market_download_tokens');
  }

  /**
   * Cria um token temporário para download seguro.
   * ttlMinutes padrão: 30 minutos.
   */
  static async createToken(params: { listingId: string; buyerId: string; downloadUrl: string; ttlMinutes?: number }): Promise<string> {
    const { listingId, buyerId, downloadUrl } = params;
    const ttl = (params.ttlMinutes ?? 30);
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000);
    const docRef = await addDoc(this.tokensCollection(), {
      listingId,
      buyerId,
      downloadUrl,
      consumed: false,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
    } as any);
    return docRef.id;
  }

  static async getToken(id: string): Promise<MarketDownloadToken | null> {
    const ref = doc(db, 'market_download_tokens', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    return {
      id: snap.id,
      listingId: data.listingId,
      buyerId: data.buyerId,
      downloadUrl: data.downloadUrl,
      consumed: !!data.consumed,
      createdAt: data.createdAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || new Date(),
    };
  }

  static async consumeToken(id: string): Promise<void> {
    const ref = doc(db, 'market_download_tokens', id);
    await updateDoc(ref, {
      consumed: true,
      updatedAt: Timestamp.now(),
    } as any);
  }
}