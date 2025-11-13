import { db } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, Timestamp, updateDoc, where, deleteDoc } from 'firebase/firestore';
import { MarketListing, MarketOrder } from '@/types/firebase';

export class MarketService {
  static listingsCollection() {
    return collection(db, 'market_listings');
  }

  static ordersCollection() {
    return collection(db, 'market_orders');
  }

  /**
   * Lista pedidos para o(s) vendedor(es) informado(s), ordenados por criação desc.
   * Usado no painel Admin para marcar entregas.
   */
  static async listOrdersForSeller(sellerIds: string | string[], limitNum?: number): Promise<MarketOrder[]> {
    const ids = Array.isArray(sellerIds) ? sellerIds.filter(Boolean) : [sellerIds].filter(Boolean);
    if (ids.length === 0) return [];
    // Tentar consulta com 'in' e orderBy; pode requerer índice composto
    try {
      let q = query(this.ordersCollection(), where('sellerId', 'in', ids), orderBy('createdAt', 'desc'));
      if (limitNum) q = query(q, limit(limitNum));
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || undefined,
          ratedAt: data.ratedAt?.toDate() || undefined,
        } as MarketOrder;
      });
    } catch (err) {
      // Fallback: executar uma consulta por sellerId e mesclar em memória
      console.warn('listOrdersForSeller: índice composto ausente, usando fallback', err);
      const results: MarketOrder[] = [];
      for (const sid of ids) {
        const q = query(this.ordersCollection(), where('sellerId', '==', sid));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          const data = d.data() as any;
          results.push({
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || undefined,
            ratedAt: data.ratedAt?.toDate() || undefined,
          } as MarketOrder);
        }
      }
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return limitNum ? results.slice(0, limitNum) : results;
    }
  }

  static async listListings(options?: { tag?: string; limitNum?: number }) : Promise<MarketListing[]> {
    let q = query(this.listingsCollection(), orderBy('createdAt', 'desc'));
    if (options?.tag) {
      q = query(this.listingsCollection(), where('tags', 'array-contains', options.tag), orderBy('createdAt', 'desc'));
    }
    if (options?.limitNum) {
      q = query(q, limit(options.limitNum));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any), createdAt: d.data().createdAt?.toDate() || new Date() })) as MarketListing[];
  }

  static async getListing(id: string) : Promise<MarketListing | null> {
    const ref = doc(db, 'market_listings', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    return { id: snap.id, ...data, createdAt: data.createdAt?.toDate() || new Date() } as MarketListing;
  }

  private static sanitizeForCreate(obj: Record<string, any>) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) continue;
      if (typeof v === 'number' && Number.isNaN(v)) continue;
      if (Array.isArray(v) && v.length === 0) continue;
      if (typeof v === 'string' && v.trim() === '') continue;
      out[k] = v;
    }
    return out;
  }

  private static sanitizeForUpdate(obj: Record<string, any>) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) continue;
      if (typeof v === 'number' && Number.isNaN(v)) continue;
      // Em updates, manter strings vazias e arrays vazios para limpar campos se necessário
      out[k] = v;
    }
    return out;
  }

  static async createListing(listing: Omit<MarketListing, 'id' | 'createdAt' | 'status' | 'rating' | 'ratingCount'>) : Promise<string> {
    const payload = this.sanitizeForCreate(listing);
    const docRef = await addDoc(this.listingsCollection(), {
      ...payload,
      status: 'active',
      rating: 0,
      ratingCount: 0,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  }

  static async updateListing(id: string, updates: Partial<Omit<MarketListing, 'id' | 'createdAt' | 'rating' | 'ratingCount'>>) : Promise<void> {
    const ref = doc(db, 'market_listings', id);
    const payload = this.sanitizeForUpdate(updates as any);
    await updateDoc(ref, {
      ...payload,
      updatedAt: Timestamp.now(),
    } as any);
  }

  static async deleteListing(id: string): Promise<void> {
    await deleteDoc(doc(db, 'market_listings', id));
  }

  static async placeOrder(order: Omit<MarketOrder, 'id' | 'createdAt' | 'updatedAt' | 'status'>) : Promise<string> {
    const docRef = await addDoc(this.ordersCollection(), {
      ...order,
      status: 'pending',
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  }

  static async updateOrderStatus(orderId: string, status: MarketOrder['status']) {
    await updateDoc(doc(db, 'market_orders', orderId), {
      status,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Lista pedidos de compras de um comprador, ordenados por criação desc.
   */
  static async listOrdersForBuyer(buyerId: string, limitNum?: number): Promise<MarketOrder[]> {
    try {
      let q = query(this.ordersCollection(), where('buyerId', '==', buyerId), orderBy('createdAt', 'desc'));
      if (limitNum) q = query(q, limit(limitNum));
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || undefined,
          ratedAt: data.ratedAt?.toDate() || undefined,
        } as MarketOrder;
      });
    } catch (err) {
      // Fallback sem índice composto: buscar por buyerId e ordenar em memória
      console.warn('listOrdersForBuyer: índice composto ausente, usando fallback', err);
      const q = query(this.ordersCollection(), where('buyerId', '==', buyerId));
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || undefined,
          ratedAt: data.ratedAt?.toDate() || undefined,
        } as MarketOrder;
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return limitNum ? items.slice(0, limitNum) : items;
    }
  }

  // Buscar o pedido mais recente de um comprador para um anúncio específico
  static async getLatestOrderForBuyerListing(buyerId: string, listingId: string): Promise<MarketOrder | null> {
    try {
      const q = query(
        this.ordersCollection(),
        where('buyerId', '==', buyerId),
        where('listingId', '==', listingId),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.docs.length === 0) return null;
      const d = snap.docs[0];
      const data = d.data() as any;
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || undefined,
        ratedAt: data.ratedAt?.toDate() || undefined,
      } as MarketOrder;
    } catch (err) {
      // Fallback sem índice composto: buscar por buyerId, filtrar listingId e ordenar em memória
      console.warn('getLatestOrderForBuyerListing: índice composto ausente, usando fallback', err);
      const q = query(this.ordersCollection(), where('buyerId', '==', buyerId));
      const snap = await getDocs(q);
      const items = snap.docs
        .map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || undefined,
            ratedAt: data.ratedAt?.toDate() || undefined,
          } as MarketOrder;
        })
        .filter((o) => o.listingId === listingId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return items[0] || null;
    }
  }

  // Avaliar pedido e atualizar agregados do anúncio
  static async rateOrderAndListing(params: { orderId: string; listingId: string; rating: number; review?: string }): Promise<void> {
    const { orderId, listingId, rating, review } = params;
    const orderRef = doc(db, 'market_orders', orderId);
    const listingRef = doc(db, 'market_listings', listingId);

    // Não usar transação por simplicidade; atualizar ordenadamente
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) return;
    const orderData = orderSnap.data() as any;
    if (orderData.rating) {
      // já avaliado; não duplicar
      return;
    }
    // Gate: permitir avaliar somente após entrega concluída
    if (orderData.status !== 'delivered') {
      throw new Error('Avaliação só é permitida após a entrega concluída.');
    }
    await updateDoc(orderRef, {
      rating,
      review: review || '',
      ratedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as any);

    const listingSnap = await getDoc(listingRef);
    if (!listingSnap.exists()) return;
    const ldata = listingSnap.data() as any;
    const prevRating = Number(ldata.rating || 0);
    const prevCount = Number(ldata.ratingCount || 0);
    const newCount = prevCount + 1;
    const newRating = Number(((prevRating * prevCount + rating) / newCount).toFixed(2));
    await updateDoc(listingRef, {
      rating: newRating,
      ratingCount: newCount,
      updatedAt: Timestamp.now(),
    } as any);
  }
}