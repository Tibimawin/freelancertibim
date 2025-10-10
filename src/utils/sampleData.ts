import { JobService } from '@/services/firebase';
import { Job } from '@/types/firebase';

const sampleJobs = [
  {
    title: "Testar novo app de delivery iOS",
    description: "Precisamos de freelancers para validar o fluxo de pedidos, pagamento e entrega de um novo aplicativo de delivery de comida. A tarefa deve incluir cadastro, busca de restaurantes, processo de pedido e acompanhamento da entrega.",
    posterId: "sample-poster-1",
    posterName: "FoodTech Startup",
    bounty: 850.00,
    platform: "iOS" as const,
    difficulty: "Médio" as const,
    requirements: [
      "iPhone com iOS 15 ou superior",
      "Localização em São Paulo ou Rio de Janeiro",
      "Disponibilidade para tarefa durante horário comercial"
    ],
    attachments: [],
    status: "active" as const,
    timeEstimate: "2-3 horas",
    location: "São Paulo/Rio de Janeiro",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    detailedInstructions: [
      {
        id: "inst1",
        step: 1,
        instruction: "Baixe o aplicativo e faça seu cadastro com dados reais",
        isRequired: true
      },
      {
        id: "inst2",
        step: 2,
        instruction: "Busque por restaurantes na sua região e adicione itens ao carrinho",
        isRequired: true
      },
      {
        id: "inst3",
        step: 3,
        instruction: "Complete o processo de pagamento (não será cobrado)",
        isRequired: true
      }
    ],
    proofRequirements: [
      {
        id: "proof1",
        type: "screenshot" as const,
        label: "Tela de confirmação do pedido",
        description: "Captura da tela final confirmando que o pedido foi realizado",
        isRequired: true,
        placeholder: "Upload da captura de tela"
      },
      {
        id: "proof2",
        type: "text" as const,
        label: "Número do pedido",
        description: "Informe o número do pedido gerado pelo aplicativo",
        isRequired: true,
        placeholder: "Digite o número do pedido aqui..."
      }
    ]
  },
  {
    title: "Tarefa de usabilidade - App bancário",
    description: "Tarefa completo de funcionalidades de um app bancário, incluindo transferências, PIX e investimentos. Foco especial em tarefas de segurança e usabilidade.",
    posterId: "sample-poster-2",
    posterName: "FinTech Brasil",
    bounty: 1200.00,
    platform: "Android" as const,
    difficulty: "Difícil" as const,
    requirements: [
      "Android 10 ou superior",
      "Experiência prévia com apps bancários",
      "Conhecimento básico em segurança mobile"
    ],
    attachments: [],
    status: "active" as const,
    timeEstimate: "4-5 horas",
    location: "Remote",
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    detailedInstructions: [
      {
        id: "inst4",
        step: 1,
        instruction: "Instale o app e configure autenticação biométrica",
        isRequired: true
      },
      {
        id: "inst5",
        step: 2,
        instruction: "Teste transferências PIX e DOC/TED",
        isRequired: true
      }
    ],
    proofRequirements: [
      {
        id: "proof3",
        type: "file" as const,
        label: "Relatório de tarefas",
        description: "Documento detalhado com todas as tarefas realizadas",
        isRequired: true,
        placeholder: "Upload do arquivo solicitado"
      }
    ]
  },
  {
    title: "Validação de e-commerce web",
    description: "Trabalhar jornada completa de compra em plataforma e-commerce, desde cadastro até finalização do pedido. Incluir tarefas em diferentes navegadores.",
    posterId: "sample-poster-3",
    posterName: "Commerce Solutions",
    bounty: 650.00,
    platform: "Web" as const,
    difficulty: "Fácil" as const,
    requirements: [
      "Acesso a computador/notebook",
      "Múltiplos navegadores (Chrome, Firefox, Safari)",
      "Conexão estável de internet"
    ],
    attachments: [],
    status: "active" as const,
    timeEstimate: "1-2 horas",
    location: "Remote",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    detailedInstructions: [
      {
        id: "inst6",
        step: 1,
        instruction: "Acesse o site da loja e cadastre-se como novo usuário",
        isRequired: true
      },
      {
        id: "inst7",
        step: 2,
        instruction: "Navegue pelas categorias e adicione produtos ao carrinho",
        isRequired: true
      },
      {
        id: "inst8",
        step: 3,
        instruction: "Teste o checkout completo em diferentes navegadores",
        isRequired: true
      }
    ],
    proofRequirements: [
      {
        id: "proof4",
        type: "screenshot" as const,
        label: "Confirmação de pedido",
        description: "Capture a tela de confirmação do pedido finalizado",
        isRequired: true,
        placeholder: "Upload da confirmação"
      },
      {
        id: "proof5",
        type: "text" as const,
        label: "Navegadores trabalhados",
        description: "Liste todos os navegadores onde você trabalhou no site",
        isRequired: true,
        placeholder: "Ex: Chrome 119, Firefox 120, Safari 17"
      }
    ]
  },
  {
    title: "Beta test - App de fitness",
    description: "Tarefa de nova versão de aplicativo de fitness com rastreamento de atividades e planos de treino personalizados. Validar precisão dos dados e usabilidade.",
    posterId: "sample-poster-4",
    posterName: "FitTech Co",
    bounty: 950.00,
    platform: "iOS" as const,
    difficulty: "Médio" as const,
    requirements: [
      "iPhone com iOS 14 ou superior",
      "Apple Watch (opcional mas preferível)",
      "Prática regular de exercícios"
    ],
    attachments: [],
    status: "active" as const,
    timeEstimate: "3-4 horas",
    location: "Remote",
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    detailedInstructions: [
      {
        id: "inst9",
        step: 1,
        instruction: "Baixe o app e registre-se com perfil de usuário fitness",
        isRequired: true
      },
      {
        id: "inst10",
        step: 2,
        instruction: "Configure seus objetivos e dados físicos no app",
        isRequired: true
      },
      {
        id: "inst11",
        step: 3,
        instruction: "Complete pelo menos 3 treinos usando as funcionalidades",
        isRequired: true
      },
      {
        id: "inst12",
        step: 4,
        instruction: "Teste o rastreamento de atividades durante exercícios",
        isRequired: false
      }
    ],
    proofRequirements: [
      {
        id: "proof6",
        type: "screenshot" as const,
        label: "Perfil configurado",
        description: "Captura da tela do seu perfil com dados preenchidos",
        isRequired: true,
        placeholder: "Upload da tela do perfil"
      },
      {
        id: "proof7",
        type: "screenshot" as const,
        label: "Histórico de treinos",
        description: "Tela mostrando os treinos completados",
        isRequired: true,
        placeholder: "Upload do histórico"
      },
      {
        id: "proof8",
        type: "text" as const,
        label: "Feedback geral",
        description: "Descreva sua experiência geral com o app",
        isRequired: false,
        placeholder: "Conte sua experiência..."
      }
    ]
  },
  {
    title: "Tarefa de app educacional Android",
    description: "Validar funcionalidades de um aplicativo educacional para crianças. Trabalhar jogos interativos, sistema de recompensas e controles parentais.",
    posterId: "sample-poster-5",
    posterName: "EduKids Tech",
    bounty: 750.00,
    platform: "Android" as const,
    difficulty: "Fácil" as const,
    requirements: [
      "Android 9 ou superior",
      "Acesso a crianças entre 6-12 anos para tarefas",
      "Paciência para trabalhar com público infantil"
    ],
    attachments: [],
    status: "active" as const,
    timeEstimate: "2-3 horas",
    location: "Remote",
    dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    detailedInstructions: [
      {
        id: "inst13",
        step: 1,
        instruction: "Instale o app e crie conta de responsável/pai",
        isRequired: true
      },
      {
        id: "inst14",
        step: 2,
        instruction: "Configure controles parentais e perfil da criança",
        isRequired: true
      },
      {
        id: "inst15",
        step: 3,
        instruction: "Deixe a criança jogar por pelo menos 30 minutos",
        isRequired: true
      },
      {
        id: "inst16",
        step: 4,
        instruction: "Teste o rastreamento de atividades durante exercícios",
        isRequired: true
      }
    ],
    proofRequirements: [
      {
        id: "proof9",
        type: "screenshot" as const,
        label: "Controles parentais configurados",
        description: "Tela dos controles parentais devidamente configurados",
        isRequired: true,
        placeholder: "Upload da configuração"
      },
      {
        id: "proof10",
        type: "screenshot" as const,
        label: "Progresso da criança",
        description: "Tela mostrando o progresso/conquistas da criança",
        isRequired: true,
        placeholder: "Upload do progresso"
      },
      {
        id: "proof11",
        type: "text" as const,
        label: "Idade da criança freelancer",
        description: "Informe a idade da criança que participou da tarefa",
        isRequired: true,
        placeholder: "Ex: 8 anos"
      },
      {
        id: "proof12",
        type: "text" as const,
        label: "Feedback dos pais",
        description: "Opinião dos pais sobre a adequação do conteúdo",
        isRequired: false,
        placeholder: "Sua opinião como responsável..."
      }
    ]
  }
];

export const createSampleData = async () => {
  try {
    console.log('Creating sample jobs...');
    
    for (const jobData of sampleJobs) {
      const jobId = await JobService.createJob(jobData);
      console.log(`Created job: ${jobData.title} with ID: ${jobId}`);
    }
    
    console.log('Sample data creation completed!');
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
};

// Uncomment the line below to run sample data creation
createSampleData();