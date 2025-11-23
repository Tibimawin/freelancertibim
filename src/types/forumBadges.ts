export interface ForumBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement: {
    type: 'solutions_accepted' | 'upvotes_received' | 'topics_created' | 'helpful_replies' | 'forum_reputation';
    count: number;
  };
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

export interface UserForumStats {
  userId: string;
  reputation: number;
  solutionsAccepted: number;
  upvotesReceived: number;
  topicsCreated: number;
  repliesCreated: number;
  helpfulTopicsResolved: number; // Tópicos de outros que você ajudou a resolver
  badges: string[]; // IDs dos badges conquistados
  lastUpdated: Date;
}

export const FORUM_BADGES: ForumBadge[] = [
  // Solutions Accepted Badges
  {
    id: 'first_solution',
    name: 'Primeira Solução',
    description: 'Teve sua primeira resposta aceita como solução',
    icon: 'CheckCircle2',
    color: 'text-green-500',
    requirement: { type: 'solutions_accepted', count: 1 },
    tier: 'bronze'
  },
  {
    id: 'solution_helper',
    name: 'Ajudante',
    description: '5 respostas aceitas como solução',
    icon: 'Award',
    color: 'text-blue-500',
    requirement: { type: 'solutions_accepted', count: 5 },
    tier: 'silver'
  },
  {
    id: 'solution_expert',
    name: 'Especialista',
    description: '25 respostas aceitas como solução',
    icon: 'Trophy',
    color: 'text-yellow-500',
    requirement: { type: 'solutions_accepted', count: 25 },
    tier: 'gold'
  },
  {
    id: 'solution_master',
    name: 'Mestre das Soluções',
    description: '100 respostas aceitas como solução',
    icon: 'Crown',
    color: 'text-purple-500',
    requirement: { type: 'solutions_accepted', count: 100 },
    tier: 'platinum'
  },
  
  // Upvotes Badges
  {
    id: 'popular_contributor',
    name: 'Contribuidor Popular',
    description: 'Recebeu 50 upvotes no total',
    icon: 'ThumbsUp',
    color: 'text-orange-500',
    requirement: { type: 'upvotes_received', count: 50 },
    tier: 'bronze'
  },
  {
    id: 'community_favorite',
    name: 'Favorito da Comunidade',
    description: 'Recebeu 200 upvotes no total',
    icon: 'Heart',
    color: 'text-pink-500',
    requirement: { type: 'upvotes_received', count: 200 },
    tier: 'silver'
  },
  {
    id: 'upvote_legend',
    name: 'Lenda dos Upvotes',
    description: 'Recebeu 500 upvotes no total',
    icon: 'Star',
    color: 'text-amber-500',
    requirement: { type: 'upvotes_received', count: 500 },
    tier: 'gold'
  },
  
  // Topics Created Badges
  {
    id: 'conversation_starter',
    name: 'Iniciador de Conversas',
    description: 'Criou 10 tópicos no fórum',
    icon: 'MessageSquare',
    color: 'text-cyan-500',
    requirement: { type: 'topics_created', count: 10 },
    tier: 'bronze'
  },
  {
    id: 'discussion_leader',
    name: 'Líder de Discussões',
    description: 'Criou 50 tópicos no fórum',
    icon: 'Users',
    color: 'text-indigo-500',
    requirement: { type: 'topics_created', count: 50 },
    tier: 'silver'
  },
  
  // Reputation Badges
  {
    id: 'trusted_member',
    name: 'Membro Confiável',
    description: 'Alcançou 1000 pontos de reputação',
    icon: 'Shield',
    color: 'text-emerald-500',
    requirement: { type: 'forum_reputation', count: 1000 },
    tier: 'silver'
  },
  {
    id: 'forum_veteran',
    name: 'Veterano do Fórum',
    description: 'Alcançou 5000 pontos de reputação',
    icon: 'Medal',
    color: 'text-violet-500',
    requirement: { type: 'forum_reputation', count: 5000 },
    tier: 'gold'
  },
  {
    id: 'forum_legend',
    name: 'Lenda do Fórum',
    description: 'Alcançou 10000 pontos de reputação',
    icon: 'Gem',
    color: 'text-red-500',
    requirement: { type: 'forum_reputation', count: 10000 },
    tier: 'diamond'
  }
];

// Pontos de reputação por ação
export const REPUTATION_POINTS = {
  TOPIC_CREATED: 5,
  REPLY_CREATED: 2,
  SOLUTION_ACCEPTED: 50,
  UPVOTE_RECEIVED: 10,
  DOWNVOTE_RECEIVED: -5,
  TOPIC_RESOLVED_HELPED: 25, // Quando sua resposta é aceita em tópico de outro
};
