import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import * as crypto from 'crypto';

admin.initializeApp();

const COINBASE_API_KEY = "a72f9fb4-d2f2-487a-bb7a-5c456a048f34";
const COINBASE_API_URL = "https://api.commerce.coinbase.com";

interface CoinbaseCharge {
  id: string;
  hosted_url: string;
  pricing: {
    local: {
      amount: string;
      currency: string;
    };
  };
}

// Criar charge para depósito cripto
export const createCryptoCharge = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar autenticado');
  }

  const { amount, currency = 'USD' } = data;
  
  if (!amount || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Valor deve ser maior que 0');
  }

  try {
    const chargeData = {
      name: `Depósito - Freelancer Tests`,
      description: `Depósito de ${currency} ${amount} para carteira`,
      local_price: {
        amount: amount.toString(),
        currency: currency
      },
      pricing_type: 'fixed_price',
      metadata: {
        userId: context.auth.uid,
        type: 'deposit'
      }
    };

    const response = await axios.post(
      `${COINBASE_API_URL}/charges`,
      chargeData,
      {
        headers: {
          'X-CC-Api-Key': COINBASE_API_KEY,
          'X-CC-Version': '2018-03-22',
          'Content-Type': 'application/json'
        }
      }
    );

    const charge: CoinbaseCharge = response.data.data;

    // Salvar a charge no Firestore para rastreamento
    await admin.firestore().collection('crypto_charges').doc(charge.id).set({
      chargeId: charge.id,
      userId: context.auth.uid,
      amount: parseFloat(amount),
      currency,
      status: 'created',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      hosted_url: charge.hosted_url
    });

    return {
      chargeId: charge.id,
      hosted_url: charge.hosted_url,
      amount,
      currency
    };

  } catch (error: any) {
    console.error('Erro ao criar charge:', error.response?.data || error.message);
    throw new functions.https.HttpsError('internal', 'Erro ao criar pagamento cripto');
  }
});

// Webhook para processar pagamentos confirmados
export const handleCryptoWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const signature = req.headers['x-cc-webhook-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Validar assinatura do webhook (opcional mas recomendado)
    // const expectedSignature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
    
    const event = req.body;
    
    if (event.type === 'charge:confirmed') {
      const charge = event.data;
      const chargeId = charge.id;
      const userId = charge.metadata?.userId;

      if (!userId) {
        console.error('UserId não encontrado no metadata do charge');
        res.status(400).send('UserId não encontrado');
        return;
      }

      // Buscar informações da charge no Firestore
      const chargeDoc = await admin.firestore().collection('crypto_charges').doc(chargeId).get();
      
      if (!chargeDoc.exists) {
        console.error('Charge não encontrada no Firestore:', chargeId);
        res.status(404).send('Charge não encontrada');
        return;
      }

      const chargeData = chargeDoc.data()!;
      
      // Verificar se já foi processado
      if (chargeData.status === 'completed') {
        res.status(200).send('Pagamento já processado');
        return;
      }

      const amount = parseFloat(charge.pricing.local.amount);
      const currency = charge.pricing.local.currency;

      // Converter para BRL se necessário (simplificado - usar taxa real em produção)
      const exchangeRates: { [key: string]: number } = {
        'USD': 5.20,
        'USDC': 5.20,
        'USDT': 5.20,
        'ETH': 13000.00,
        'BTC': 350000.00
      };

      const amountBRL = currency === 'BRL' ? amount : amount * (exchangeRates[currency] || 5.20);

      // Atualizar saldo do usuário
      const userRef = admin.firestore().collection('users').doc(userId);
      
      await admin.firestore().runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) {
          throw new Error('Usuário não encontrado');
        }

        const userData = userDoc.data()!;
        const currentBalance = userData.wallet?.balance || 0;
        const newBalance = currentBalance + amountBRL;

        // Atualizar saldo
        transaction.update(userRef, {
          'wallet.balance': newBalance,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Criar registro de transação
        const transactionRef = admin.firestore().collection('transactions').doc();
        transaction.set(transactionRef, {
          userId,
          type: 'deposit',
          amount: amountBRL,
          currency: 'BRL',
          status: 'completed',
          provider: 'coinbase',
          description: `Depósito cripto ${amount} ${currency}`,
          metadata: {
            chargeId,
            originalAmount: amount,
            originalCurrency: currency,
            exchangeRate: exchangeRates[currency] || 5.20
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Marcar charge como completada
        transaction.update(admin.firestore().collection('crypto_charges').doc(chargeId), {
          status: 'completed',
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          finalAmount: amountBRL
        });
      });

      console.log(`Pagamento processado: ${userId} - ${amountBRL} BRL`);
      res.status(200).send('Pagamento processado com sucesso');

    } else {
      res.status(200).send('Evento não processado');
    }

  } catch (error: any) {
    console.error('Erro no webhook:', error.message);
    res.status(500).send('Erro interno do servidor');
  }
});

// Expirar bônus automaticamente após 30 dias
export const expireBonusBalances = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const now = new Date();
  const usersRef = admin.firestore().collection('users');
  const snapshot = await usersRef.where('posterWallet.bonusBalance', '>', 0).get();
  const batch = admin.firestore().batch();

  let expiredCount = 0;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as any;
    const expiresAtRaw = data.posterWallet?.bonusExpiresAt;
    const expiresAtDate = expiresAtRaw?.toDate ? expiresAtRaw.toDate() : (expiresAtRaw ? new Date(expiresAtRaw) : null);
    if (expiresAtDate && expiresAtDate <= now) {
      const ref = usersRef.doc(docSnap.id);
      batch.update(ref, {
        'posterWallet.bonusBalance': 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      expiredCount += 1;
    }
  });

  if (expiredCount > 0) {
    await batch.commit();
  }

  console.log(`expireBonusBalances: ${expiredCount} bônus expirados.`);
  return null;
});