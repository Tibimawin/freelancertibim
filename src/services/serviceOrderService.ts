import { db } from '@/lib/firebase';
import { addDoc, collection, doc, getDocs, getDoc, limit, orderBy, query, Timestamp, updateDoc, where, runTransaction, increment } from 'firebase/firestore';
import { TransactionService } from '@/services/firebase';
import { NotificationService } from '@/services/notificationService';
import { ServiceOrder } from '@/types/firebase';
import { ReceiptService, generateReceiptHtml } from '@/services/receiptService';

export class ServiceOrderService {
  static ordersCollection() {
    return collection(db, 'service_orders');
  }

  static async placeOrder(order: Omit<ServiceOrder, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
    const docRef = await addDoc(this.ordersCollection(), {
      ...order,
      status: 'pending',
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  }

  static async updateOrderStatus(orderId: string, status: ServiceOrder['status']): Promise<void> {
    const orderRef = doc(db, 'service_orders', orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Lista pedidos de um comprador, ordenados por criação desc.
   */
  static async listOrdersForBuyer(buyerId: string, limitNum?: number): Promise<ServiceOrder[]> {
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
        } as ServiceOrder;
      });
    } catch (err) {
      // Fallback sem índice composto: buscar por buyerId e ordenar em memória
      const q = query(this.ordersCollection(), where('buyerId', '==', buyerId));
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || undefined,
        } as ServiceOrder;
      });
      const sorted = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return limitNum ? sorted.slice(0, limitNum) : sorted;
    }
  }

  /**
   * Busca o pedido mais recente de um comprador para um serviço específico.
   */
  static async getLatestOrderForBuyerListing(buyerId: string, listingId: string): Promise<ServiceOrder | null> {
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
      } as ServiceOrder;
    } catch (err) {
      // Fallback: buscar por buyerId e filtrar listingId
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
          } as ServiceOrder;
        })
        .filter((o) => o.listingId === listingId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return items[0] || null;
    }
  }

  /**
   * Lista pedidos de um vendedor (criador do serviço), ordenados por criação desc.
   */
  static async listOrdersForSeller(sellerId: string, limitNum?: number): Promise<ServiceOrder[]> {
    try {
      let q = query(this.ordersCollection(), where('sellerId', '==', sellerId), orderBy('createdAt', 'desc'));
      if (limitNum) q = query(q, limit(limitNum));
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || undefined,
        } as ServiceOrder;
      });
    } catch (err) {
      // Fallback sem índice composto
      const q = query(this.ordersCollection(), where('sellerId', '==', sellerId));
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || undefined,
        } as ServiceOrder;
      });
      const sorted = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return limitNum ? sorted.slice(0, limitNum) : sorted;
    }
  }

  /**
   * Confirmação de entrega pelo comprador. Não libera pagamento automaticamente.
   * Admin poderá liberar após essa confirmação.
   */
  static async confirmBuyerDelivery(orderId: string): Promise<void> {
    const orderRef = doc(db, 'service_orders', orderId);
    await updateDoc(orderRef, {
      buyerConfirmedDelivery: true,
      buyerConfirmedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as any);
  }

  /**
   * Lista todos os pedidos (admin).
   */
  static async listAll(limitNum?: number): Promise<ServiceOrder[]> {
    let q = query(this.ordersCollection(), orderBy('createdAt', 'desc'));
    if (limitNum) q = query(q, limit(limitNum));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || undefined,
      } as ServiceOrder;
    });
  }

  /**
   * Libera escrow e marca pedido como entregue.
   * - Debita pendente do contratante (posterWallet.pendingBalance)
   * - Debita pendente do vendedor (testerWallet.pendingBalance)
   * - Credita disponível do vendedor (testerWallet.availableBalance) e totalEarnings
   * - Cria transações de payout e liberação de escrow
   * - Atualiza status do pedido para 'delivered'
   */
  static async completeOrderAndReleaseEscrow(orderId: string, opts?: { force?: boolean }): Promise<void> {
    const orderRef = doc(db, 'service_orders', orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) throw new Error('Pedido não encontrado');
    const order = { id: orderSnap.id, ...(orderSnap.data() as any) } as ServiceOrder;

    // Regras de segurança: somente liberar se o pedido está em escrow e o comprador confirmou entrega
    if (order.status !== 'paid') {
      throw new Error('Pedido não está em escrow (status pago).');
    }
    if (!order.buyerConfirmedDelivery && !opts?.force) {
      throw new Error('Entrega não confirmada pelo comprador.');
    }

    const sellerRef = doc(db, 'users', order.sellerId);
    const buyerRef = doc(db, 'users', order.buyerId);

    await runTransaction(db, async (tx) => {
      const sellerDoc = await tx.get(sellerRef);
      const buyerDoc = await tx.get(buyerRef);
      const amount = order.amount || 0;

      if (sellerDoc.exists()) {
        const sellerData = sellerDoc.data() as any;
        const currentAvail = sellerData?.testerWallet?.availableBalance || 0;
        const currentEarn = sellerData?.testerWallet?.totalEarnings || 0;
        const currentPendingSeller = sellerData?.testerWallet?.pendingBalance || 0;
        tx.update(sellerRef, {
          'testerWallet.availableBalance': currentAvail + amount,
          'testerWallet.totalEarnings': currentEarn + amount,
          'testerWallet.pendingBalance': Math.max(0, currentPendingSeller - amount),
          updatedAt: Timestamp.now(),
        });
      }

      if (buyerDoc.exists()) {
        const posterData = buyerDoc.data() as any;
        const currentPending = posterData?.posterWallet?.pendingBalance || 0;
        tx.update(buyerRef, {
          'posterWallet.pendingBalance': Math.max(0, currentPending - amount),
          updatedAt: Timestamp.now(),
        });
      }

      tx.update(orderRef, {
        status: 'delivered',
        updatedAt: Timestamp.now(),
      });
    });

    // Gerar recibo HTML e salvar
    const [buyerUserSnap, sellerUserSnap] = await Promise.all([
      getDoc(doc(db, 'users', order.buyerId)),
      getDoc(doc(db, 'users', order.sellerId)),
    ]);
    const buyerName = (buyerUserSnap.data() as any)?.name || order.buyerName || order.buyerId;
    const sellerName = (sellerUserSnap.data() as any)?.name || order.sellerName || order.sellerId;
    const html = generateReceiptHtml({
      orderId: order.id,
      listingId: order.listingId,
      buyerName,
      sellerName,
      amount: order.amount,
      currency: order.currency,
      releasedAt: new Date(),
    });
    const receiptId = await ReceiptService.createReceipt({
      orderId: order.id,
      listingId: order.listingId,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      amount: order.amount,
      currency: order.currency,
      html,
      participants: [order.buyerId, order.sellerId],
    });

    // Transações e notificações fora da transação
    await Promise.all([
      TransactionService.createTransaction({
        userId: order.sellerId,
        type: 'service_payout',
        amount: order.amount,
        currency: order.currency,
        status: 'completed',
        description: `Pagamento por serviço entregue: ${order.listingId}`,
        provider: 'system',
        metadata: { orderId: order.id, listingId: order.listingId, service: true },
      } as any),
      TransactionService.createTransaction({
        userId: order.buyerId,
        type: 'escrow_release',
        amount: order.amount,
        currency: order.currency,
        status: 'completed',
        description: `Liberação de escrow do serviço: ${order.listingId}`,
        provider: 'system',
        metadata: { orderId: order.id, listingId: order.listingId, service: true },
      } as any),
      NotificationService.createNotification({
        userId: order.sellerId,
        type: 'service_order_delivered',
        title: 'Pagamento liberado',
        message: 'O pagamento do serviço foi liberado em sua carteira.',
        read: false,
        metadata: { orderId: order.id, listingId: order.listingId, receiptId },
      }),
      NotificationService.createNotification({
        userId: order.buyerId,
        type: 'service_order_delivered',
        title: 'Pedido entregue',
        message: 'O serviço foi marcado como entregue e o pagamento foi liberado.',
        read: false,
        metadata: { orderId: order.id, listingId: order.listingId, receiptId },
      }),
    ]);
  }

  /**
   * Abre disputa para um pedido de serviço.
   */
  static async openDispute(params: { orderId: string; openedById: string; reason: string; description?: string; evidenceUrls?: string[] }): Promise<void> {
    const { orderId, openedById, reason, description, evidenceUrls } = params;
    const orderRef = doc(db, 'service_orders', orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) throw new Error('Pedido não encontrado');
    const data = snap.data() as any;
    const order = { id: snap.id, ...data } as ServiceOrder;
    if (order.status !== 'paid' && order.status !== 'delivered') {
      throw new Error('Disputa só pode ser aberta para pedidos pagos/entregues.');
    }
    if (openedById !== order.buyerId && openedById !== order.sellerId) {
      throw new Error('Somente participantes podem abrir disputa.');
    }
    await updateDoc(orderRef, {
      disputeStatus: 'open',
      disputeReason: reason,
      disputeDescription: description || '',
      disputeEvidenceUrls: evidenceUrls && evidenceUrls.length ? evidenceUrls : (order.disputeEvidenceUrls || []),
      disputeOpenedBy: openedById,
      disputeOpenedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as any);
    const notifyOther = openedById === order.buyerId ? order.sellerId : order.buyerId;
    await Promise.all([
      NotificationService.createNotification({
        userId: notifyOther,
        type: 'service_order_dispute_opened',
        title: 'Disputa aberta',
        message: `Uma disputa foi aberta para o pedido ${order.id}.`,
        read: false,
        metadata: { orderId: order.id, listingId: order.listingId },
      }),
      NotificationService.createNotification({
        userId: openedById,
        type: 'service_order_dispute_opened',
        title: 'Disputa registrada',
        message: `Sua disputa para o pedido ${order.id} foi registrada e será analisada pelo admin.`,
        read: false,
        metadata: { orderId: order.id, listingId: order.listingId },
      }),
    ]);
  }

  /**
   * Adiciona evidência à disputa do pedido.
   */
  static async addDisputeEvidence(params: { orderId: string; userId: string; evidenceUrl: string }): Promise<void> {
    const { orderId, userId, evidenceUrl } = params;
    const orderRef = doc(db, 'service_orders', orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) throw new Error('Pedido não encontrado');
    const order = snap.data() as any;
    const existing: string[] = order.disputeEvidenceUrls || [];
    await updateDoc(orderRef, {
      disputeEvidenceUrls: [...existing, evidenceUrl],
      updatedAt: Timestamp.now(),
    } as any);
    await NotificationService.createNotification({
      userId,
      type: 'service_order_dispute_opened',
      title: 'Evidência anexada',
      message: 'Sua evidência foi anexada à disputa.',
      read: false,
      metadata: { orderId },
    });
  }

  /**
   * Resolve a disputa (admin). Para 'pay_seller', faz liberação. Para 'refund_buyer', reembolsa saldo do comprador.
   */
  static async resolveDispute(params: { orderId: string; decision: 'refund_buyer' | 'pay_seller' | 'partial_refund'; amount?: number; reason?: string; adminId?: string }): Promise<void> {
    const { orderId, decision, amount, reason, adminId } = params;
    const orderRef = doc(db, 'service_orders', orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) throw new Error('Pedido não encontrado');
    const order = { id: snap.id, ...(snap.data() as any) } as ServiceOrder;

    const partialAmount = typeof amount === 'number' ? Math.max(0, Math.min(amount, order.amount)) : undefined;

    if (decision === 'pay_seller') {
      await this.completeOrderAndReleaseEscrow(orderId, { force: true });
    } else if (decision === 'refund_buyer') {
      // Reembolso total ao comprador, se ainda em escrow
      if (order.status !== 'paid') {
        throw new Error('Somente pedidos em escrow podem ser reembolsados.');
      }
      const sellerRef = doc(db, 'users', order.sellerId);
      const buyerRef = doc(db, 'users', order.buyerId);
      await runTransaction(db, async (tx) => {
        const sellerDoc = await tx.get(sellerRef);
        const buyerDoc = await tx.get(buyerRef);
        const refundAmount = order.amount;
        if (sellerDoc.exists()) {
          const sData = sellerDoc.data() as any;
          const currentPendingSeller = sData?.testerWallet?.pendingBalance || 0;
          tx.update(sellerRef, {
            'testerWallet.pendingBalance': Math.max(0, currentPendingSeller - refundAmount),
            updatedAt: Timestamp.now(),
          });
        }
        if (buyerDoc.exists()) {
          const bData = buyerDoc.data() as any;
          const currentPendingBuyer = bData?.posterWallet?.pendingBalance || 0;
          const currentBalanceBuyer = bData?.posterWallet?.balance || 0;
          tx.update(buyerRef, {
            'posterWallet.pendingBalance': Math.max(0, currentPendingBuyer - refundAmount),
            'posterWallet.balance': currentBalanceBuyer + refundAmount,
            updatedAt: Timestamp.now(),
          });
        }
        tx.update(orderRef, {
          status: 'cancelled',
          updatedAt: Timestamp.now(),
        });
      });
      await TransactionService.createTransaction({
        userId: order.buyerId,
        type: 'refund',
        amount: order.amount,
        currency: order.currency,
        status: 'completed',
        description: `Reembolso de disputa do serviço: ${order.listingId}`,
        provider: 'system',
        metadata: { orderId: order.id, listingId: order.listingId, service: true },
      } as any);
    } else if (decision === 'partial_refund' && partialAmount && partialAmount > 0) {
      // Parte ao comprador, resto ao vendedor
      if (order.status !== 'paid') {
        throw new Error('Somente pedidos em escrow podem ser liquidados parcialmente.');
      }
      const sellerRef = doc(db, 'users', order.sellerId);
      const buyerRef = doc(db, 'users', order.buyerId);
      await runTransaction(db, async (tx) => {
        const sellerDoc = await tx.get(sellerRef);
        const buyerDoc = await tx.get(buyerRef);
        const refundAmount = partialAmount;
        const payoutAmount = order.amount - refundAmount;
        if (sellerDoc.exists()) {
          const sData = sellerDoc.data() as any;
          const currentPendingSeller = sData?.testerWallet?.pendingBalance || 0;
          const currentAvail = sData?.testerWallet?.availableBalance || 0;
          const currentEarn = sData?.testerWallet?.totalEarnings || 0;
          tx.update(sellerRef, {
            'testerWallet.pendingBalance': Math.max(0, currentPendingSeller - payoutAmount),
            'testerWallet.availableBalance': currentAvail + payoutAmount,
            'testerWallet.totalEarnings': currentEarn + payoutAmount,
            updatedAt: Timestamp.now(),
          });
        }
        if (buyerDoc.exists()) {
          const bData = buyerDoc.data() as any;
          const currentPendingBuyer = bData?.posterWallet?.pendingBalance || 0;
          const currentBalanceBuyer = bData?.posterWallet?.balance || 0;
          tx.update(buyerRef, {
            'posterWallet.pendingBalance': Math.max(0, currentPendingBuyer - order.amount),
            'posterWallet.balance': currentBalanceBuyer + refundAmount,
            updatedAt: Timestamp.now(),
          });
        }
        tx.update(orderRef, {
          status: 'delivered',
          updatedAt: Timestamp.now(),
        });
      });
      await Promise.all([
        TransactionService.createTransaction({
          userId: order.sellerId,
          type: 'service_payout',
          amount: order.amount - partialAmount,
          currency: order.currency,
          status: 'completed',
          description: `Pagamento parcial por decisão de disputa: ${order.listingId}`,
          provider: 'system',
          metadata: { orderId: order.id, listingId: order.listingId, service: true },
        } as any),
        TransactionService.createTransaction({
          userId: order.buyerId,
          type: 'refund',
          amount: partialAmount,
          currency: order.currency,
          status: 'completed',
          description: `Reembolso parcial por decisão de disputa: ${order.listingId}`,
          provider: 'system',
          metadata: { orderId: order.id, listingId: order.listingId, service: true },
        } as any),
      ]);
    }

    await updateDoc(orderRef, {
      disputeStatus: 'resolved',
      disputeResolution: {
        decision,
        amount: partialAmount,
        reason: reason || '',
        resolvedBy: adminId || 'admin',
        resolvedAt: Timestamp.now(),
      },
      updatedAt: Timestamp.now(),
    } as any);

    await Promise.all([
      NotificationService.createNotification({
        userId: order.sellerId,
        type: 'service_order_dispute_resolved',
        title: 'Disputa resolvida',
        message: `A disputa do pedido ${order.id} foi resolvida: ${decision}.`,
        read: false,
        metadata: { orderId: order.id, listingId: order.listingId },
      }),
      NotificationService.createNotification({
        userId: order.buyerId,
        type: 'service_order_dispute_resolved',
        title: 'Disputa resolvida',
        message: `A disputa do pedido ${order.id} foi resolvida: ${decision}.`,
        read: false,
        metadata: { orderId: order.id, listingId: order.listingId },
      }),
    ]);
  }

  /**
   * Avalia um pedido de serviço e atualiza agregados do anúncio de serviço.
   * Permite avaliação somente após status 'delivered'.
   */
  static async rateOrderAndListing(params: { orderId: string; listingId: string; rating: number; review?: string }): Promise<void> {
    const { orderId, listingId, rating, review } = params;
    const orderRef = doc(db, 'service_orders', orderId);
    const listingRef = doc(db, 'services_listings', listingId);

    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) return;
    const orderData = orderSnap.data() as any;
    if (orderData.rating) {
      return; // já avaliado
    }
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
export default ServiceOrderService;