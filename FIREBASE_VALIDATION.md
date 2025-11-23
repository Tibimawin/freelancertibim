# Firebase Data Validation Utilities

## Overview

Este módulo fornece funções utilitárias para prevenir erros ao salvar dados no Firebase/Firestore, especialmente erros causados por valores `undefined`.

## Funções Disponíveis

### `cleanFirebaseData<T>(obj: T, removeEmptyStrings?: boolean): Partial<T>`

Remove automaticamente valores `undefined` e `null` de objetos antes de salvá-los no Firestore.

**Características:**
- Remove `undefined` e `null` recursivamente
- Preserva objetos Date
- Limpa arrays removendo itens `undefined`/`null`
- Opcionalmente remove strings vazias
- Remove objetos/arrays vazios resultantes da limpeza

**Uso:**
```typescript
import { cleanFirebaseData } from '@/lib/firebaseUtils';

const jobData = {
  title: "Minha Tarefa",
  description: "Descrição",
  category: undefined, // Será removido
  bounty: 100,
  dueDate: new Date(), // Preservado
  recurrence: undefined, // Será removido
  tags: [undefined, "tag1", null, "tag2"], // Vira ["tag1", "tag2"]
};

const cleaned = cleanFirebaseData(jobData);
// Resultado: { title: "Minha Tarefa", description: "Descrição", bounty: 100, dueDate: Date, tags: ["tag1", "tag2"] }

await addDoc(collection(db, 'jobs'), cleaned);
```

### `validateNoUndefined(obj: Record<string, any>, objectName?: string): void`

Valida que um objeto não contém valores `undefined` e lança erro com lista de campos problemáticos.

**Uso:**
```typescript
import { validateNoUndefined } from '@/lib/firebaseUtils';

const data = {
  name: "João",
  email: undefined,
  address: {
    city: "Luanda",
    street: undefined
  }
};

try {
  validateNoUndefined(data, 'User Data');
} catch (error) {
  // Error: User Data contains undefined values in fields: email, address.street
  console.error(error.message);
}
```

### `emptyStringsToNull<T>(obj: T): T`

Converte strings vazias em `null`, útil para dados de formulários onde campos vazios devem ser tratados como `null`.

**Uso:**
```typescript
import { emptyStringsToNull } from '@/lib/firebaseUtils';

const formData = {
  name: "João",
  email: "joao@email.com",
  phone: "", // Vira null
  address: {
    city: "Luanda",
    complement: "" // Vira null
  }
};

const converted = emptyStringsToNull(formData);
// { name: "João", email: "joao@email.com", phone: null, address: { city: "Luanda", complement: null } }
```

## Padrões de Uso Recomendados

### 1. Criar Documentos

```typescript
import { cleanFirebaseData } from '@/lib/firebaseUtils';
import { addDoc, collection } from 'firebase/firestore';

// ANTES (propenso a erros)
await addDoc(collection(db, 'jobs'), jobData);

// DEPOIS (seguro)
const cleanedData = cleanFirebaseData(jobData);
await addDoc(collection(db, 'jobs'), cleanedData);
```

### 2. Atualizar Documentos

```typescript
import { cleanFirebaseData } from '@/lib/firebaseUtils';
import { updateDoc, doc } from 'firebase/firestore';

const updates = {
  title: "Novo Título",
  category: undefined, // Problemático!
  updatedAt: new Date()
};

// SEGURO
const cleanUpdates = cleanFirebaseData(updates);
await updateDoc(doc(db, 'jobs', jobId), cleanUpdates);
```

### 3. Formulários com Validação

```typescript
import { cleanFirebaseData, emptyStringsToNull } from '@/lib/firebaseUtils';

const handleSubmit = async (formData: any) => {
  // Converter strings vazias em null
  const normalized = emptyStringsToNull(formData);
  
  // Remover undefined/null
  const cleanData = cleanFirebaseData(normalized);
  
  // Salvar no Firestore
  await addDoc(collection(db, 'users'), cleanData);
};
```

### 4. Debug e Desenvolvimento

```typescript
import { validateNoUndefined, cleanFirebaseData } from '@/lib/firebaseUtils';

// Durante desenvolvimento, validar dados antes de salvar
if (process.env.NODE_ENV === 'development') {
  try {
    validateNoUndefined(jobData, 'Job Data');
  } catch (error) {
    console.error('⚠️ Found undefined values:', error.message);
  }
}

// Em produção, sempre limpar
const cleanData = cleanFirebaseData(jobData);
await addDoc(collection(db, 'jobs'), cleanData);
```

## Quando Usar

### Use `cleanFirebaseData`:
- ✅ Antes de qualquer `addDoc()`
- ✅ Antes de qualquer `setDoc()`
- ✅ Antes de qualquer `updateDoc()`
- ✅ Quando dados vêm de formulários com campos opcionais
- ✅ Quando construindo objetos dinamicamente

### Use `validateNoUndefined`:
- ✅ Durante desenvolvimento para debug
- ✅ Em testes unitários
- ✅ Para validar dados de APIs externas
- ⚠️ Não use em produção (use `cleanFirebaseData` em vez disso)

### Use `emptyStringsToNull`:
- ✅ Ao processar dados de formulários HTML
- ✅ Quando campos vazios devem ser tratados como "não preenchido"
- ✅ Antes de aplicar `cleanFirebaseData` se quiser remover esses nulls

## Erros Comuns Evitados

### Erro: "Unsupported field value: undefined"
```typescript
// ❌ ERRADO
const job = {
  title: "Tarefa",
  category: undefined, // ERRO!
};
await addDoc(collection(db, 'jobs'), job);

// ✅ CORRETO
const cleanJob = cleanFirebaseData(job);
await addDoc(collection(db, 'jobs'), cleanJob);
```

### Erro: Campos opcionais causando problemas
```typescript
// ❌ ERRADO
const updates = {
  title: newTitle,
  dueDate: formData.dueDate || undefined, // Pode ser undefined!
};
await updateDoc(docRef, updates);

// ✅ CORRETO
const updates = cleanFirebaseData({
  title: newTitle,
  dueDate: formData.dueDate || undefined,
});
await updateDoc(docRef, updates);
```

## Performance

As funções são otimizadas para:
- Processar objetos grandes rapidamente
- Não modificar o objeto original
- Remover objetos/arrays vazios resultantes
- Preservar tipos especiais (Date, etc.)

## TypeScript

Todas as funções são fortemente tipadas:
```typescript
const data: JobData = { /* ... */ };
const cleaned = cleanFirebaseData(data); // Tipo: Partial<JobData>
const withCast = cleanFirebaseData(data) as JobData; // Se você tem certeza que campos required existem
```

## Exemplos Práticos

### CreateJob (implementado)
```typescript
// src/pages/CreateJob.tsx
const cleanedJobData = cleanFirebaseData(jobData) as typeof jobData;
await JobService.createJobWithPayment(cleanedJobData, currentUser.uid, totalCost);
```

### Outros Formulários
Aplique o mesmo padrão em:
- Criação de usuários
- Atualização de perfis
- Criação de serviços do marketplace
- Configurações do sistema
- Qualquer outro formulário que salva no Firestore
