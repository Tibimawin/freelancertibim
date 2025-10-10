# 🤖 Regras de Desenvolvimento para Dyad AI

Este documento descreve a pilha de tecnologia utilizada neste projeto e as diretrizes para o uso de bibliotecas específicas. O objetivo é garantir consistência, manutenibilidade e adesão às melhores práticas.

## 🚀 Pilha de Tecnologia

*   **Frontend Framework**: React (com TypeScript)
*   **Build Tool**: Vite
*   **Linguagem**: TypeScript
*   **Estilização**: Tailwind CSS
*   **Componentes UI**: shadcn/ui (construído sobre Radix UI)
*   **Roteamento**: React Router DOM
*   **Gerenciamento de Estado/Dados**: React Query (Tanstack Query)
*   **Backend as a Service (BaaS)**: Firebase (Auth, Firestore, Storage, Cloud Functions)
*   **Ícones**: Lucide React
*   **Validação de Formulários**: React Hook Form com Zod
*   **Notificações Toast**: Sonner
*   **Manipulação de Datas**: date-fns

## 📚 Regras de Uso de Bibliotecas

Para manter a consistência e a eficiência, siga estas regras ao desenvolver:

*   **Componentes UI**:
    *   **Sempre** utilize os componentes do `shadcn/ui` para elementos de interface.
    *   Se um componente específico não estiver disponível no `shadcn/ui` ou precisar de personalização profunda, crie um novo componente utilizando as primitivas do `Radix UI` e estilize-o com `Tailwind CSS`. **Não modifique os arquivos de componentes do `shadcn/ui` diretamente.**
*   **Estilização**:
    *   **Exclusivamente** utilize `Tailwind CSS` para toda a estilização. Evite estilos inline ou arquivos CSS personalizados, a menos que seja estritamente necessário para estilos globais (como `src/index.css`).
*   **Ícones**:
    *   **Sempre** utilize o pacote `lucide-react` para todos os ícones.
*   **Gerenciamento de Estado e Dados**:
    *   Para gerenciamento de estado do servidor e busca de dados (data fetching), utilize `@tanstack/react-query`.
    *   Para estado local de componentes, utilize os hooks `useState` e `useReducer` do React.
*   **Roteamento**:
    *   Utilize `react-router-dom` para todo o roteamento do lado do cliente. Mantenha as rotas definidas em `src/App.tsx`.
*   **Formulários e Validação**:
    *   Utilize `react-hook-form` para o gerenciamento de formulários e `zod` para a validação de esquemas.
*   **Backend, Banco de Dados e Autenticação**:
    *   Utilize `Firebase` para todos os serviços de backend: autenticação (Firebase Auth), banco de dados (Firestore), armazenamento de arquivos (Firebase Storage) e funções serverless (Firebase Cloud Functions).
*   **Notificações**:
    *   Utilize `sonner` para exibir notificações toast ao usuário.
*   **Manipulação de Datas**:
    *   Utilize `date-fns` para qualquer formatação ou manipulação de datas.
*   **Requisições HTTP (fora das Cloud Functions)**:
    *   Para requisições HTTP gerais, `axios` está disponível. No entanto, para chamadas específicas do Firebase (como funções callable), utilize o SDK do Firebase diretamente.