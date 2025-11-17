import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ReceiptData {
  orderId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  html: string;
  participants: string[]; // [buyerId, sellerId]
}

export class ReceiptService {
  static async createReceipt(data: ReceiptData): Promise<string> {
    const docRef = await addDoc(collection(db, 'receipts'), {
      orderId: data.orderId,
      listingId: data.listingId,
      buyerId: data.buyerId,
      sellerId: data.sellerId,
      amount: data.amount,
      currency: data.currency,
      html: data.html,
      participants: data.participants,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  }
}

export function generateReceiptHtml(params: {
  orderId: string;
  listingId: string;
  buyerName: string;
  sellerName: string;
  amount: number;
  currency: string;
  releasedAt: Date;
}): string {
  const { orderId, listingId, buyerName, sellerName, amount, currency, releasedAt } = params;
  return `<!doctype html>
  <html><head><meta charset="utf-8"><title>Recibo ${orderId}</title>
  <style>body{font-family:Arial, sans-serif; padding:16px;} .row{display:flex; justify-content:space-between} .muted{color:#667}</style>
  </head><body>
    <h2>Recibo de Liberação de Pagamento</h2>
    <p class="muted">Pedido: ${orderId} • Serviço: ${listingId}</p>
    <div class="row"><div>Comprador</div><div>${buyerName}</div></div>
    <div class="row"><div>Vendedor</div><div>${sellerName}</div></div>
    <div class="row"><div>Valor</div><div>${amount.toLocaleString('pt-BR')} ${currency}</div></div>
    <div class="row"><div>Data</div><div>${releasedAt.toLocaleString('pt-BR')}</div></div>
    <p class="muted">Este recibo é gerado automaticamente pelo sistema após liberação de escrow.</p>
  </body></html>`;
}