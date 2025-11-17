import { db } from '@/lib/firebase';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, Timestamp, updateDoc } from 'firebase/firestore';
import { ServiceListing } from '@/types/firebase';

export class ServicesService {
  static listingsCollection() {
    return collection(db, 'services_listings');
  }

  static async list(options?: { limitNum?: number; tag?: string }): Promise<ServiceListing[]> {
    let q = query(this.listingsCollection(), orderBy('createdAt', 'desc'));
    if (options?.tag) {
      // Filtrar por tag, se existir
      q = query(this.listingsCollection(), orderBy('createdAt', 'desc'));
    }
    if (options?.limitNum) q = query(q, limit(options.limitNum));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as ServiceListing;
    });
  }

  static async get(id: string): Promise<ServiceListing | null> {
    const ref = doc(db, 'services_listings', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    return { id: snap.id, ...data, createdAt: data.createdAt?.toDate() || new Date() } as ServiceListing;
  }

  private static sanitize(obj: Record<string, any>, keepEmpty = false) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) continue;
      if (typeof v === 'number' && Number.isNaN(v)) continue;
      if (!keepEmpty) {
        if (Array.isArray(v) && v.length === 0) continue;
        if (typeof v === 'string' && v.trim() === '') continue;
      }
      out[k] = v;
    }
    return out;
  }

  static async create(listing: Omit<ServiceListing, 'id' | 'createdAt' | 'rating' | 'ratingCount' | 'status'>): Promise<string> {
    const payload = this.sanitize(listing);
    const ref = await addDoc(this.listingsCollection(), {
      ...payload,
      status: 'active',
      rating: 0,
      ratingCount: 0,
      createdAt: Timestamp.now(),
    });
    return ref.id;
  }

  static async update(id: string, updates: Partial<Omit<ServiceListing, 'id' | 'createdAt'>>): Promise<void> {
    const ref = doc(db, 'services_listings', id);
    await updateDoc(ref, { ...this.sanitize(updates, true) });
  }

  static async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, 'services_listings', id));
  }
}

export default ServicesService;