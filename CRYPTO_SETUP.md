# 🚀 Configuração da Integração Coinbase Commerce

Este guia explica como configurar as Cloud Functions do Firebase para integração com criptomoedas.

## 📋 Pré-requisitos

1. **Firebase CLI** instalado globalmente:
```bash
npm install -g firebase-tools
```

2. **Conta Coinbase Commerce** ativa com API Key:
   - API Key já configurada: `a72f9fb4-d2f2-487a-bb7a-5c456a048f34`

## 🛠️ Instalação das Cloud Functions

### 1. Fazer login no Firebase
```bash
firebase login
```

### 2. Inicializar o projeto (se ainda não foi feito)
```bash
firebase init functions
```

### 3. Instalar dependências das Functions
```bash
cd functions
npm install
```

### 4. Deploy das Functions
```bash
npm run deploy
```

## ⚙️ Configuração do Webhook

Para receber notificações de pagamentos confirmados, configure o webhook no Coinbase Commerce:

1. Acesse: https://commerce.coinbase.com/dashboard/settings
2. Vá em **Webhooks**
3. Adicione o endpoint:
   ```
   https://<região>-<projeto-id>.cloudfunctions.net/handleCryptoWebhook
   ```
4. Selecione eventos: `charge:confirmed`

## 📱 Como Funciona

### Fluxo de Depósito:

1. **Usuário clica "Depositar com Cripto"**
2. **Frontend chama `createCryptoCharge`** → gera link de pagamento
3. **Usuário paga via Coinbase Commerce**
4. **Coinbase envia webhook** → `handleCryptoWebhook`
5. **Saldo atualizado automaticamente** no Firestore

### Estrutura no Firestore:

#### Coleção: `crypto_charges`
```json
{
  "chargeId": "ABC123",
  "userId": "user123",
  "amount": 25.50,
  "currency": "USDC",
  "status": "completed",
  "createdAt": "2025-09-14T15:00:00Z",
  "hosted_url": "https://commerce.coinbase.com/charges/ABC123"
}
```

#### Coleção: `transactions`
```json
{
  "userId": "user123",
  "type": "deposit",
  "amount": 132.60,
  "currency": "BRL",
  "status": "completed",
  "provider": "coinbase",
  "description": "Depósito cripto 25.50 USDC",
  "metadata": {
    "chargeId": "ABC123",
    "originalAmount": 25.50,
    "originalCurrency": "USDC",
    "exchangeRate": 5.20
  },
  "createdAt": "2025-09-14T15:05:00Z"
}
```

## 🔑 Taxas de Câmbio

Atualmente usando taxas fixas (atualize conforme necessário):
- **USDC/USDT**: R$ 5,20
- **ETH**: R$ 13.000,00  
- **BTC**: R$ 350.000,00

## 🧪 Teste

1. Faça login na aplicação
2. Clique em **"Depositar com Cripto"**
3. Escolha moeda e valor (teste com $1 USDC)
4. Complete o pagamento no Coinbase Commerce
5. Aguarde confirmação da blockchain (~5-10 min)
6. Verifique se o saldo foi atualizado

## 🔒 Segurança

- ✅ API Key da Coinbase nunca exposta no frontend
- ✅ Validação de autenticação nas Functions
- ✅ Transações atômicas no Firestore
- ✅ Logs detalhados para auditoria
- ⚠️ **TODO**: Implementar validação de assinatura do webhook

## 📊 Monitoramento

Logs das Functions:
```bash
firebase functions:log
```

## 🚨 Troubleshooting

### Erro: "Usuário deve estar autenticado"
- Verifique se o usuário está logado
- Confirme que o token de autenticação é válido

### Webhook não recebido
- Verifique a URL do webhook no Coinbase Commerce
- Confirme que a Function foi deployada corretamente
- Verifique os logs: `firebase functions:log`

### Saldo não atualizado
- Confirme se o pagamento foi realmente confirmado na blockchain
- Verifique os logs da Function `handleCryptoWebhook`
- Confirme se a transação foi salva na coleção `transactions`

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs das Functions
2. Confirme a configuração do webhook
3. Teste com valores pequenos primeiro
4. Entre em contato com suporte técnico se necessário