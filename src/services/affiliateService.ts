import { addDoc, collection, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type AffiliateEventType = 'share' | 'click';

export interface AffiliateEvent {
  id?: string;
  type: AffiliateEventType;
  affiliateId: string; // quem compartilha/recebe comissão
  listingId: string;
  platform?: string; // WhatsApp, Telegram, Facebook, copy, web
  visitorId?: string | null; // para clique, se houver
  createdAt: Date;
}

export interface AffiliateMetricsItem {
  affiliateId: string;
  shares: number;
  clicks: number;
  conversions: number; // pedidos com affiliateId
  commissionPaid: number; // soma das comissões pagas
  commissionPending: number; // soma das comissões pendentes
  lastActivity?: Date;
}

export class AffiliateService {
  static eventsCollection() {
    return collection(db, 'affiliate_events');
  }

  static async logShare(params: { affiliateId: string; listingId: string; platform: string }): Promise<void> {
    const { affiliateId, listingId, platform } = params;
    if (!affiliateId || !listingId) return;
    await addDoc(this.eventsCollection(), {
      type: 'share',
      affiliateId,
      listingId,
      platform,
      createdAt: Timestamp.now(),
    });
  }

  static async logClick(params: { affiliateId: string; listingId: string; visitorId?: string | null }): Promise<void> {
    const { affiliateId, listingId, visitorId } = params;
    if (!affiliateId || !listingId) return;
    await addDoc(this.eventsCollection(), {
      type: 'click',
      affiliateId,
      listingId,
      visitorId: visitorId ?? null,
      createdAt: Timestamp.now(),
    });
  }

  /**
   * Agrega métricas entre startDate e endDate (default: últimos 30 dias).
   * Usa consulta por createdAt e mescla dados de pedidos do Mercado em memória.
   */
  static async getMetrics(params?: { startDate?: Date; endDate?: Date }): Promise<AffiliateMetricsItem[]> {
    const startDate = params?.startDate ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = params?.endDate ?? new Date();
    // Buscar eventos
    let q = query(this.eventsCollection(), where('createdAt', '>=', Timestamp.fromDate(startDate)), where('createdAt', '<=', Timestamp.fromDate(endDate)), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const byAffiliate: Record<string, { shares: number; clicks: number; lastActivity?: Date; listings: Set<string> }> = {};
    snap.forEach((d) => {
      const data = d.data() as any;
      const aff = data.affiliateId as string;
      const created = data.createdAt?.toDate?.() || new Date();
      if (!byAffiliate[aff]) byAffiliate[aff] = { shares: 0, clicks: 0, lastActivity: created, listings: new Set<string>() };
      if (data.type === 'share') byAffiliate[aff].shares += 1;
      if (data.type === 'click') byAffiliate[aff].clicks += 1;
      byAffiliate[aff].lastActivity = !byAffiliate[aff].lastActivity || created > (byAffiliate[aff].lastActivity as Date) ? created : byAffiliate[aff].lastActivity;
      if (data.listingId) byAffiliate[aff].listings.add(data.listingId);
    });

    // Buscar pedidos com createdAt no intervalo e agregar por affiliateId
    const ordersSnap = await getDocs(query(collection(db, 'market_orders'), where('createdAt', '>=', Timestamp.fromDate(startDate)), where('createdAt', '<=', Timestamp.fromDate(endDate)), orderBy('createdAt', 'desc')));
    const metrics: Record<string, AffiliateMetricsItem> = {};
    ordersSnap.forEach((d) => {
      const data = d.data() as any;
      const aff: string | undefined = data.affiliateId;
      if (!aff) return;
      const status: string = data.status;
      const paidStatus: string | undefined = data.affiliateCommissionStatus;
      const rate: number = typeof data.affiliateCommissionRate === 'number' ? data.affiliateCommissionRate : 0.05;
      const amount: number = Number(data.amount || 0);
      const commissionAmount: number = typeof data.affiliateCommissionAmount === 'number' ? Number(data.affiliateCommissionAmount) : Number((amount * rate).toFixed(2));
      if (!metrics[aff]) {
        metrics[aff] = {
          affiliateId: aff,
          shares: 0,
          clicks: 0,
          conversions: 0,
          commissionPaid: 0,
          commissionPending: 0,
          lastActivity: undefined,
        };
      }
      metrics[aff].conversions += 1;
      if (paidStatus === 'paid' || status === 'delivered') {
        metrics[aff].commissionPaid += commissionAmount;
      } else {
        metrics[aff].commissionPending += commissionAmount;
      }
      const created = data.createdAt?.toDate?.() || new Date();
      metrics[aff].lastActivity = !metrics[aff].lastActivity || created > (metrics[aff].lastActivity as Date) ? created : metrics[aff].lastActivity;
    });

    // Mesclar eventos (shares/clicks) nos metrics
    for (const [aff, ev] of Object.entries(byAffiliate)) {
      if (!metrics[aff]) {
        metrics[aff] = {
          affiliateId: aff,
          shares: ev.shares,
          clicks: ev.clicks,
          conversions: 0,
          commissionPaid: 0,
          commissionPending: 0,
          lastActivity: ev.lastActivity,
        };
      } else {
        metrics[aff].shares += ev.shares;
        metrics[aff].clicks += ev.clicks;
        // lastActivity: já atualizado
      }
    }

    return Object.values(metrics).sort((a, b) => (b.commissionPaid + b.commissionPending) - (a.commissionPaid + a.commissionPending));
  }
}