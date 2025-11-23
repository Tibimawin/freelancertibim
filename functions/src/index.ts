import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import * as crypto from 'crypto';
import { Resend } from 'resend';

admin.initializeApp();

const resend = new Resend(process.env.RESEND_API_KEY);

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

// Enviar lembretes automáticos para contratantes com provas pendentes há mais de 48 horas
export const sendPendingProofReminders = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  
  try {
    // Buscar aplicações com status 'submitted' há mais de 48 horas
    const applicationsRef = admin.firestore().collection('applications');
    const pendingAppsSnapshot = await applicationsRef
      .where('status', '==', 'submitted')
      .get();

    let remindersSent = 0;
    const batch = admin.firestore().batch();

    for (const appDoc of pendingAppsSnapshot.docs) {
      const appData = appDoc.data();
      const submittedAt = appData.proofSubmission?.submittedAt?.toDate();
      const lastReminderSent = appData.lastReminderSentAt?.toDate();

      if (!submittedAt || submittedAt > fortyEightHoursAgo) {
        continue; // Não passou 48 horas ainda
      }

      // Evitar enviar lembrete mais de uma vez por dia
      if (lastReminderSent) {
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (lastReminderSent > twentyFourHoursAgo) {
          continue; // Já enviou lembrete nas últimas 24 horas
        }
      }

      // Buscar dados do job e do contratante
      const jobDoc = await admin.firestore().collection('jobs').doc(appData.jobId).get();
      if (!jobDoc.exists) continue;
      
      const jobData = jobDoc.data()!;
      const posterDoc = await admin.firestore().collection('users').doc(jobData.posterId).get();
      if (!posterDoc.exists) continue;

      const posterData = posterDoc.data()!;
      const posterEmail = posterData.email;
      const posterName = posterData.name || posterData.displayName || 'Contratante';

      // Calcular há quantas horas está pendente
      const hoursPending = Math.floor((now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60));

      try {
        // Enviar email de lembrete
        const { error } = await resend.emails.send({
      from: 'Ango Tarefas <noreply@angotarefas.online>',
          to: [posterEmail],
          subject: '⏰ Lembrete: Provas pendentes de revisão',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                  .reminder-icon { font-size: 48px; margin-bottom: 10px; }
                  .job-title { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                  .time-info { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
                  .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
                  .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                  .urgent { color: #dc2626; font-weight: bold; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <div class="reminder-icon">⏰</div>
                    <h1 style="margin: 0;">Lembrete de Revisão</h1>
                    <p style="margin: 10px 0 0 0;">Você tem provas aguardando revisão</p>
                  </div>
                  <div class="content">
                    <p>Olá ${posterName},</p>
                    
                    <p>Este é um lembrete de que você tem provas pendentes de revisão:</p>
                    
                    <div class="job-title">
                      <strong>Tarefa:</strong> ${jobData.title}
                    </div>

                    <div class="time-info">
                      <strong>⏱️ Aguardando há ${hoursPending} horas</strong>
                    </div>
                    
                    <p><strong>Freelancer:</strong> ${appData.testerName}</p>
                    
                    <p>Os freelancers dependem de avaliações rápidas para receberem seus pagamentos. Quanto mais rápido você revisar, melhor será a experiência para todos!</p>
                    
                    <div style="text-align: center;">
                      <a href="${process.env.APP_URL || 'https://freelancertests.web.app'}/manage-applications" class="button">
                        Revisar Provas Agora
                      </a>
                    </div>
                    
                    <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                      <strong>Dica:</strong> Avaliações rápidas ajudam a atrair freelancers de qualidade e melhoram sua reputação na plataforma.
                    </p>
                  </div>
                  <div class="footer">
                    <p>Freelancer Tests - Plataforma de Trabalhos Freelance</p>
                    <p style="font-size: 12px;">Você receberá este lembrete uma vez por dia enquanto houver provas pendentes.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });

        if (error) {
          console.error('Erro ao enviar lembrete:', error);
        } else {
          // Marcar quando o lembrete foi enviado
          batch.update(appDoc.ref, {
            lastReminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          remindersSent++;
        }
      } catch (emailError) {
        console.error('Erro ao processar lembrete para aplicação', appDoc.id, ':', emailError);
      }
    }

    if (remindersSent > 0) {
      await batch.commit();
    }

    console.log(`sendPendingProofReminders: ${remindersSent} lembretes enviados.`);
    return null;
  } catch (error: any) {
    console.error('Erro na função de lembretes:', error);
    return null;
  }
});

// Enviar lembretes para usuários inativos há mais de 7 dias
export const sendInactiveUserReminders = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  try {
    // Buscar usuários inativos
    const usersRef = admin.firestore().collection('users');
    const usersSnapshot = await usersRef.get();

    let remindersSent = 0;
    const batch = admin.firestore().batch();

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const lastLoginAt = userData.lastLoginAt?.toDate();
      const lastInactiveReminderSent = userData.lastInactiveReminderSentAt?.toDate();
      const createdAt = userData.createdAt?.toDate();

      // Pular se não tem data de último login (usar createdAt como fallback)
      const lastActivityDate = lastLoginAt || createdAt;
      if (!lastActivityDate) continue;

      // Verificar se usuário está inativo há mais de 7 dias
      if (lastActivityDate > sevenDaysAgo) {
        continue; // Usuário ativo recentemente
      }

      // Evitar enviar lembrete mais de uma vez a cada 14 dias
      if (lastInactiveReminderSent && lastInactiveReminderSent > fourteenDaysAgo) {
        continue; // Já enviou lembrete recentemente
      }

      const userEmail = userData.email;
      const userName = userData.name || userData.displayName || 'Freelancer';
      const availableBalance = userData.testerWallet?.availableBalance || 0;
      const completedTests = userData.completedTests || 0;

      // Calcular dias de inatividade
      const daysInactive = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

      try {
        // Enviar email de reativação
        const { error } = await resend.emails.send({
          from: 'Ango Tarefas <noreply@angotarefas.online>',
          to: [userEmail],
          subject: '👋 Sentimos sua falta na Ango Tarefas!',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 10px 10px 0 0; text-align: center; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                  .miss-icon { font-size: 64px; margin-bottom: 10px; }
                  .stats-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                  .stat-item { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                  .stat-label { color: #6b7280; }
                  .stat-value { font-weight: bold; color: #667eea; }
                  .opportunities-box { background: #e0e7ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
                  .cta-button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
                  .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <div class="miss-icon">👋</div>
                    <h1 style="margin: 0; font-size: 32px;">Sentimos Sua Falta!</h1>
                    <p style="margin: 15px 0 0 0; font-size: 18px;">Há ${daysInactive} dias sem te ver, ${userName}</p>
                  </div>
                  <div class="content">
                    <p>Olá ${userName},</p>
                    
                    <p>Notamos que você não acessa a Ango Tarefas há ${daysInactive} dias. Muita coisa aconteceu desde então! 🚀</p>
                    
                    ${availableBalance > 0 || completedTests > 0 ? `
                      <div class="stats-box">
                        <strong style="color: #667eea; font-size: 18px;">📊 Seu Resumo:</strong>
                        ${availableBalance > 0 ? `
                          <div class="stat-item">
                            <span class="stat-label">💰 Saldo Disponível:</span>
                            <span class="stat-value">${availableBalance.toFixed(2)} Kz</span>
                          </div>
                        ` : ''}
                        ${completedTests > 0 ? `
                          <div class="stat-item">
                            <span class="stat-label">✅ Tarefas Completadas:</span>
                            <span class="stat-value">${completedTests}</span>
                          </div>
                        ` : ''}
                      </div>
                    ` : ''}

                    <div class="opportunities-box">
                      <strong style="color: #667eea; font-size: 18px;">🎯 O que você está perdendo:</strong>
                      <ul style="margin: 10px 0;">
                        <li><strong>Novas tarefas:</strong> Dezenas de oportunidades adicionadas diariamente</li>
                        <li><strong>Ganhos rápidos:</strong> Tarefas simples que pagam bem</li>
                        <li><strong>Bônus de reativação:</strong> Complete uma tarefa e ganhe pontos extras</li>
                        <li><strong>Indicações:</strong> Convide amigos e ganhe 5% de comissão</li>
                      </ul>
                    </div>

                    <p style="text-align: center; font-size: 18px; margin: 30px 0;">
                      <strong>Pronto para voltar a ganhar dinheiro?</strong>
                    </p>

                    <div style="text-align: center;">
                      <a href="${process.env.APP_URL || 'https://freelancertests.web.app'}" class="cta-button">
                        Ver Tarefas Disponíveis
                      </a>
                    </div>

                    <p style="margin-top: 30px; font-size: 14px; color: #6b7280; text-align: center;">
                      Milhares de freelancers já estão ganhando. Não fique de fora! 💪
                    </p>
                  </div>
                  <div class="footer">
                    <p><strong>Ango Tarefas</strong> - Plataforma de Trabalhos Freelance</p>
                    <p style="font-size: 12px; margin: 10px 0 0 0;">
                      Você receberá este lembrete apenas ocasionalmente quando estiver inativo.
                    </p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });

        if (error) {
          console.error('Erro ao enviar lembrete de inatividade:', error);
        } else {
          // Marcar quando o lembrete foi enviado
          batch.update(userDoc.ref, {
            lastInactiveReminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          remindersSent++;
        }
      } catch (emailError) {
        console.error('Erro ao processar lembrete para usuário', userDoc.id, ':', emailError);
      }
    }

    if (remindersSent > 0) {
      await batch.commit();
    }

    console.log(`sendInactiveUserReminders: ${remindersSent} lembretes enviados.`);
    return null;
  } catch (error: any) {
    console.error('Erro na função de lembretes de inatividade:', error);
    return null;
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

// Função para enviar email quando uma nova prova é submetida ao contratante
export const sendProofSubmittedEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar autenticado');
  }

  const { posterEmail, posterName, workerName, jobTitle, proofUrl } = data;

  if (!posterEmail || !jobTitle) {
    throw new functions.https.HttpsError('invalid-argument', 'Email do contratante e título da tarefa são obrigatórios');
// Função para enviar email de boas-vindas para novos usuários
export const sendWelcomeEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar autenticado');
  }

  const { userEmail, userName } = data;

  if (!userEmail) {
    throw new functions.https.HttpsError('invalid-argument', 'Email do usuário é obrigatório');
  }

  try {
    const { error } = await resend.emails.send({
      from: 'Ango Tarefas <noreply@angotarefas.online>',
      to: [userEmail],
      subject: '🎉 Bem-vindo(a) à Ango Tarefas!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .welcome-icon { font-size: 64px; margin-bottom: 10px; }
              .feature-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
              .feature-title { color: #667eea; font-weight: bold; margin-bottom: 8px; }
              .cta-button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
              .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
              .tips-list { background: #e0e7ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="welcome-icon">🎉</div>
                <h1 style="margin: 0; font-size: 32px;">Bem-vindo(a) à Ango Tarefas!</h1>
                <p style="margin: 15px 0 0 0; font-size: 18px;">Estamos felizes em ter você conosco, ${userName || 'Freelancer'}!</p>
              </div>
              <div class="content">
                <p>Parabéns por se juntar à maior plataforma de trabalhos freelance de Angola! 🇦🇴</p>
                
                <p><strong>Aqui está o que você pode fazer agora:</strong></p>
                
                <div class="feature-box">
                  <div class="feature-title">💼 Encontre Tarefas</div>
                  <p style="margin: 0;">Navegue por centenas de tarefas disponíveis e comece a ganhar dinheiro hoje mesmo.</p>
                </div>

                <div class="feature-box">
                  <div class="feature-title">💰 Ganhe Dinheiro</div>
                  <p style="margin: 0;">Complete tarefas simples e receba pagamentos direto na sua carteira digital.</p>
                </div>

                <div class="feature-box">
                  <div class="feature-title">📱 Trabalhe de Qualquer Lugar</div>
                  <p style="margin: 0;">Faça tarefas no seu tempo livre, de casa ou em qualquer lugar com internet.</p>
                </div>

                <div class="tips-list">
                  <strong style="color: #667eea;">💡 Dicas para Começar:</strong>
                  <ul style="margin: 10px 0 0 0;">
                    <li>Complete seu perfil para ganhar mais credibilidade</li>
                    <li>Comece com tarefas simples para construir sua reputação</li>
                    <li>Envie provas claras e completas para aprovação rápida</li>
                    <li>Mantenha uma comunicação profissional com os contratantes</li>
                    <li>Convide amigos e ganhe comissões de 5% nas tarefas deles</li>
                  </ul>
                </div>

                <div style="text-align: center;">
                  <a href="${process.env.APP_URL || 'https://freelancertests.web.app'}" class="cta-button">
                    Começar Agora
                  </a>
                </div>

                <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                  Tem dúvidas? Nossa equipe de suporte está sempre disponível para ajudar!
                </p>
              </div>
              <div class="footer">
                <p><strong>Ango Tarefas</strong> - Plataforma de Trabalhos Freelance</p>
                <p style="font-size: 12px; margin: 10px 0 0 0;">
                  Transformando oportunidades em resultados desde 2024
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Erro ao enviar email de boas-vindas:', error);
      throw new functions.https.HttpsError('internal', 'Erro ao enviar email');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});


  try {
    const { error } = await resend.emails.send({
          from: 'Ango Tarefas <noreply@angotarefas.online>',
      to: [posterEmail],
      subject: '📋 Nova prova submetida para revisão',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .notification-icon { font-size: 48px; margin-bottom: 10px; }
              .job-title { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              .worker-info { background: #e0e7ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="notification-icon">📋</div>
                <h1 style="margin: 0;">Nova Prova Recebida</h1>
                <p style="margin: 10px 0 0 0;">Uma tarefa aguarda sua revisão</p>
              </div>
              <div class="content">
                <p>Olá ${posterName || 'Contratante'},</p>
                
                <p>Um freelancer submeteu provas para revisão em sua tarefa:</p>
                
                <div class="job-title">
                  <strong>Tarefa:</strong> ${jobTitle}
                </div>
                
                <div class="worker-info">
                  <strong>Freelancer:</strong> ${workerName || 'Usuário'}
                </div>
                
                <p><strong>Próximos passos:</strong></p>
                <ul>
                  <li>Revise as provas submetidas com atenção</li>
                  <li>Verifique se o trabalho atende aos requisitos</li>
                  <li>Aprove para liberar o pagamento ou rejeite com feedback</li>
                </ul>
                
                <div style="text-align: center;">
                  <a href="${process.env.APP_URL || 'https://freelancertests.web.app'}/manage-applications" class="button">
                    Revisar Provas Agora
                  </a>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                  É importante revisar as submissões em tempo hábil para manter os freelancers engajados e garantir a qualidade do trabalho.
                </p>
              </div>
              <div class="footer">
                <p>Freelancer Tests - Plataforma de Trabalhos Freelance</p>
                <p style="font-size: 12px;">Se você não criou esta tarefa, ignore este email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Erro ao enviar email:', error);
      throw new functions.https.HttpsError('internal', 'Erro ao enviar email');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao enviar email de submissão:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Função para enviar email de notificação quando provas são aprovadas
export const sendProofApprovedEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar autenticado');
  }

  const { userEmail, userName, jobTitle, amount } = data;

  if (!userEmail || !jobTitle) {
    throw new functions.https.HttpsError('invalid-argument', 'Email e título da tarefa são obrigatórios');
  }

  try {
    const { error } = await resend.emails.send({
      from: 'Ango Tarefas <noreply@angotarefas.online>',
      to: [userEmail],
      subject: '✅ Suas provas foram aprovadas!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .success-icon { font-size: 48px; margin-bottom: 10px; }
              .amount { font-size: 32px; font-weight: bold; color: #10b981; margin: 20px 0; }
              .job-title { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">✅</div>
                <h1 style="margin: 0;">Parabéns, ${userName || 'Freelancer'}!</h1>
                <p style="margin: 10px 0 0 0;">Suas provas foram aprovadas</p>
              </div>
              <div class="content">
                <p>Ótimas notícias! O contratante revisou e aprovou suas provas.</p>
                
                <div class="job-title">
                  <strong>Tarefa:</strong> ${jobTitle}
                </div>
                
                ${amount ? `
                  <p style="text-align: center; margin: 0;">Valor creditado:</p>
                  <div class="amount">${amount} Kz</div>
                ` : ''}
                
                <p>O pagamento foi processado e já está disponível na sua carteira. Você pode sacar quando quiser!</p>
                
                <div style="text-align: center;">
                  <a href="${process.env.APP_URL || 'https://freelancertests.web.app'}/transactions" class="button">
                    Ver Transações
                  </a>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                  Continue fazendo um ótimo trabalho! Quanto mais tarefas você completar com qualidade, mais oportunidades e avaliações positivas você receberá.
                </p>
              </div>
              <div class="footer">
                <p>Freelancer Tests - Plataforma de Trabalhos Freelance</p>
                <p style="font-size: 12px;">Se você não solicitou isso, ignore este email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Erro ao enviar email:', error);
      throw new functions.https.HttpsError('internal', 'Erro ao enviar email');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao enviar email de aprovação:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Função para enviar email de notificação quando provas são rejeitadas
export const sendProofRejectedEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar autenticado');
  }

  const { userEmail, userName, jobTitle, rejectionReason } = data;

  if (!userEmail || !jobTitle) {
    throw new functions.https.HttpsError('invalid-argument', 'Email e título da tarefa são obrigatórios');
  }

  try {
    const { error } = await resend.emails.send({
      from: 'Ango Tarefas <noreply@angotarefas.online>',
      to: [userEmail],
      subject: '❌ Suas provas foram rejeitadas',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .warning-icon { font-size: 48px; margin-bottom: 10px; }
              .job-title { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
              .reason-box { background: #fee2e2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="warning-icon">❌</div>
                <h1 style="margin: 0;">Provas Rejeitadas</h1>
                <p style="margin: 10px 0 0 0;">Sua submissão precisa de ajustes</p>
              </div>
              <div class="content">
                <p>Olá ${userName || 'Freelancer'},</p>
                
                <p>Infelizmente, o contratante rejeitou suas provas para a seguinte tarefa:</p>
                
                <div class="job-title">
                  <strong>Tarefa:</strong> ${jobTitle}
                </div>
                
                ${rejectionReason ? `
                  <div class="reason-box">
                    <strong style="color: #dc2626;">Motivo da rejeição:</strong>
                    <p style="margin: 10px 0 0 0;">${rejectionReason}</p>
                  </div>
                ` : ''}
                
                <p><strong>O que você pode fazer:</strong></p>
                <ul>
                  <li>Revise cuidadosamente o motivo da rejeição</li>
                  <li>Entre em contato com o contratante para esclarecimentos se necessário</li>
                  <li>Verifique os requisitos da tarefa antes de reenviar</li>
                  <li>Prepare provas mais detalhadas e claras</li>
                </ul>
                
                <div style="text-align: center;">
                  <a href="${process.env.APP_URL || 'https://freelancertests.web.app'}/task-history" class="button">
                    Ver Minhas Tarefas
                  </a>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                  Não desanime! Use este feedback para melhorar e continue buscando novas oportunidades.
                </p>
              </div>
              <div class="footer">
                <p>Freelancer Tests - Plataforma de Trabalhos Freelance</p>
                <p style="font-size: 12px;">Se você não solicitou isso, ignore este email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Erro ao enviar email:', error);
      throw new functions.https.HttpsError('internal', 'Erro ao enviar email');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao enviar email de rejeição:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Processar tarefas recorrentes e republicá-las automaticamente
export const processRecurringJobs = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  const now = new Date();
  
  try {
    // Buscar todas as tarefas recorrentes ativas
    const jobsRef = admin.firestore().collection('jobs');
    const recurringJobsSnapshot = await jobsRef
      .where('isRecurring', '==', true)
      .where('recurrence.enabled', '==', true)
      .get();

    let jobsRepublished = 0;
    const batch = admin.firestore().batch();

    for (const jobDoc of recurringJobsSnapshot.docs) {
      const jobData = jobDoc.data();
      const recurrence = jobData.recurrence;

      if (!recurrence) continue;

      const nextPublishDate = recurrence.nextPublishDate?.toDate();
      const endDate = recurrence.endDate?.toDate();
      const totalRepublications = recurrence.totalRepublications || 0;
      const maxRepublications = recurrence.maxRepublications;

      // Verificar se atingiu o limite de republicações
      if (maxRepublications && totalRepublications >= maxRepublications) {
        batch.update(jobDoc.ref, {
          'recurrence.enabled': false,
          'isRecurring': false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        continue;
      }

      // Verificar se passou da data final
      if (endDate && now > endDate) {
        batch.update(jobDoc.ref, {
          'recurrence.enabled': false,
          'isRecurring': false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        continue;
      }

      // Verificar se chegou a hora de republicar
      if (!nextPublishDate || now < nextPublishDate) {
        continue;
      }

      // Calcular próxima data de publicação
      const calculateNextDate = (frequency: string, interval: number, from: Date): Date => {
        const next = new Date(from);
        switch (frequency) {
          case 'daily':
            next.setDate(next.getDate() + interval);
            break;
          case 'weekly':
            next.setDate(next.getDate() + interval * 7);
            break;
          case 'monthly':
            next.setMonth(next.getMonth() + interval);
            break;
        }
        return next;
      };

      const nextDate = calculateNextDate(recurrence.frequency, recurrence.interval, now);

      try {
        // Criar nova tarefa (republicação)
        const newJobData = {
          title: jobData.title,
          description: jobData.description,
          posterId: jobData.posterId,
          posterName: jobData.posterName,
          bounty: jobData.bounty,
          platform: jobData.platform,
          difficulty: jobData.difficulty,
          category: jobData.category,
          subcategory: jobData.subcategory,
          requirements: jobData.requirements || [],
          attachments: jobData.attachments || [],
          status: 'active',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          applicantCount: 0,
          timeEstimate: jobData.timeEstimate,
          location: jobData.location,
          maxApplicants: jobData.maxApplicants,
          dueDate: jobData.dueDate,
          detailedInstructions: jobData.detailedInstructions || [],
          proofRequirements: jobData.proofRequirements || [],
          posterApprovalRate: jobData.posterApprovalRate,
          posterRating: jobData.posterRating,
          youtube: jobData.youtube,
          tiktok: jobData.tiktok,
          vk: jobData.vk,
          website: jobData.website,
          instagram: jobData.instagram,
          facebook: jobData.facebook,
          originalJobId: jobDoc.id,
          republicationNumber: (jobData.republicationNumber || 0) + 1,
          isRecurring: false,
        };

        await admin.firestore().collection('jobs').add(newJobData);

        batch.update(jobDoc.ref, {
          'recurrence.lastPublished': admin.firestore.FieldValue.serverTimestamp(),
          'recurrence.nextPublishDate': admin.firestore.Timestamp.fromDate(nextDate),
          'recurrence.totalRepublications': totalRepublications + 1,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        jobsRepublished++;

        const notificationsRef = admin.firestore().collection('notifications');
        await notificationsRef.add({
          userId: jobData.posterId,
          type: 'recurring_job_published',
          title: '🔄 Tarefa Recorrente Publicada',
          message: `Sua tarefa "${jobData.title}" foi republicada automaticamente (#${(jobData.republicationNumber || 0) + 1})`,
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            jobId: jobDoc.id,
            republicationNumber: (jobData.republicationNumber || 0) + 1,
          },
        });

      } catch (error) {
        console.error('Erro ao republicar tarefa', jobDoc.id, ':', error);
      }
    }

    if (jobsRepublished > 0) {
      await batch.commit();
    }

    console.log(`processRecurringJobs: ${jobsRepublished} tarefas republicadas.`);
    return null;
  } catch (error: any) {
    console.error('Erro na função de tarefas recorrentes:', error);
    return null;
  }
});