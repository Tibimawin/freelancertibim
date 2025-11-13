import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface NamedItem {
  id: string;
  name: string;
}

export interface SubcategoryItem extends NamedItem {
  category?: string;
}

export interface PaymentRangeItem {
  id: string;
  label: string;
  min?: number;
  max?: number;
}

export class TaxonomyService {
  // Job Levels
  static async getJobLevels(): Promise<NamedItem[]> {
    const snap = await getDocs(query(collection(db, 'job_levels'), orderBy('name')));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }
  static async addJobLevel(name: string): Promise<string> {
    const ref = await addDoc(collection(db, 'job_levels'), { name });
    return ref.id;
  }
  static async deleteJobLevel(id: string): Promise<void> {
    await deleteDoc(doc(db, 'job_levels', id));
  }

  // Categories
  static async getCategories(): Promise<NamedItem[]> {
    const snap = await getDocs(query(collection(db, 'categories'), orderBy('name')));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }
  static async addCategory(name: string): Promise<string> {
    const ref = await addDoc(collection(db, 'categories'), { name });
    return ref.id;
  }
  static async deleteCategory(id: string): Promise<void> {
    await deleteDoc(doc(db, 'categories', id));
  }

  // Subcategories
  static async getSubcategories(category?: string): Promise<SubcategoryItem[]> {
    const base = collection(db, 'subcategories');
    const q = category ? query(base, where('category', '==', category)) : query(base, orderBy('name'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }
  static async addSubcategory(name: string, category?: string): Promise<string> {
    const ref = await addDoc(collection(db, 'subcategories'), { name, category });
    return ref.id;
  }
  static async deleteSubcategory(id: string): Promise<void> {
    await deleteDoc(doc(db, 'subcategories', id));
  }

  // Payment ranges (for filtering by bounty)
  static async getPaymentRanges(): Promise<PaymentRangeItem[]> {
    const snap = await getDocs(query(collection(db, 'payment_ranges'), orderBy('min')));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }
  static async addPaymentRange(label: string, min?: number, max?: number): Promise<string> {
    const ref = await addDoc(collection(db, 'payment_ranges'), { label, min: typeof min === 'number' ? min : null, max: typeof max === 'number' ? max : null });
    return ref.id;
  }
  static async deletePaymentRange(id: string): Promise<void> {
    await deleteDoc(doc(db, 'payment_ranges', id));
  }

  // Locations (suggestions)
  static async getLocations(): Promise<NamedItem[]> {
    const snap = await getDocs(query(collection(db, 'locations'), orderBy('name')));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }
  static async addLocation(name: string): Promise<string> {
    const ref = await addDoc(collection(db, 'locations'), { name });
    return ref.id;
  }
  static async deleteLocation(id: string): Promise<void> {
    await deleteDoc(doc(db, 'locations', id));
  }

  // Employer Stats labels (optional in filters)
  static async getStatsLabels(): Promise<NamedItem[]> {
    const snap = await getDocs(query(collection(db, 'stats_labels'), orderBy('name')));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }
  static async addStatsLabel(name: string): Promise<string> {
    const ref = await addDoc(collection(db, 'stats_labels'), { name });
    return ref.id;
  }
  static async deleteStatsLabel(id: string): Promise<void> {
    await deleteDoc(doc(db, 'stats_labels', id));
  }
}