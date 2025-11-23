import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  platform: string;
  taskType: string;
  defaultBounty: number;
  defaultTimeEstimate: number;
  defaultInstructions: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Email creation specific fields
  emailCreation?: {
    provider: 'gmail' | 'outlook' | 'yahoo' | 'protonmail' | 'other';
    quantity: number;
    requirements?: string;
    customProvider?: string;
  };
  proofRequirements?: Array<{
    id: string;
    type: 'text' | 'url' | 'screenshot' | 'file';
    label: string;
    description: string;
    placeholder?: string;
    isRequired: boolean;
  }>;
}

export class TaskTemplateService {
  private static collectionName = 'task_templates';

  static async createTemplate(
    templateData: Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const docRef = await addDoc(collection(db, this.collectionName), {
      ...templateData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  static async getTemplates(activeOnly = false): Promise<TaskTemplate[]> {
    let q = query(
      collection(db, this.collectionName),
      orderBy('createdAt', 'desc')
    );

    if (activeOnly) {
      q = query(
        collection(db, this.collectionName),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as TaskTemplate;
    });
  }

  static async getTemplateById(templateId: string): Promise<TaskTemplate | null> {
    const docRef = doc(db, this.collectionName, templateId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as TaskTemplate;
  }

  static async updateTemplate(
    templateId: string,
    updates: Partial<Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const docRef = doc(db, this.collectionName, templateId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  static async deleteTemplate(templateId: string): Promise<void> {
    const docRef = doc(db, this.collectionName, templateId);
    await deleteDoc(docRef);
  }

  static async duplicateTemplate(templateId: string): Promise<void> {
    const templateRef = doc(db, this.collectionName, templateId);
    const templateSnap = await getDoc(templateRef);
    
    if (!templateSnap.exists()) {
      throw new Error('Template não encontrado');
    }

    const originalTemplate = templateSnap.data();
    const duplicatedTemplate = {
      ...originalTemplate,
      name: `${originalTemplate.name} (Cópia)`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(collection(db, this.collectionName), duplicatedTemplate);
  }

  static async toggleTemplateStatus(templateId: string): Promise<void> {
    const template = await this.getTemplateById(templateId);
    if (template) {
      await this.updateTemplate(templateId, {
        isActive: !template.isActive,
      });
    }
  }

  // Pre-configured email creation templates
  static getEmailCreationTemplates(): Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>[] {
    return [
      {
        name: 'Criação de E-mail Gmail',
        description: 'Criar conta de e-mail no Gmail com credenciais válidas. Freelancer deve fazer logout antes de enviar.',
        category: 'Web',
        subcategory: 'Criar E-mail',
        platform: 'web-criar-email',
        taskType: 'email_creation',
        defaultBounty: 150,
        defaultTimeEstimate: 10,
        defaultInstructions: 'Criar uma conta de e-mail no Gmail seguindo os requisitos especificados. Após criar a conta, faça logout completo antes de enviar as credenciais.',
        isActive: true,
        emailCreation: {
          provider: 'gmail',
          quantity: 1,
          requirements: 'E-mail deve seguir o formato: nome.sobrenome@gmail.com'
        },
        proofRequirements: [
          {
            id: 'email',
            type: 'text',
            label: 'E-mail criado',
            description: 'Digite o endereço de e-mail completo criado',
            placeholder: 'exemplo@gmail.com',
            isRequired: true
          },
          {
            id: 'password',
            type: 'text',
            label: 'Senha da conta',
            description: 'Digite a senha escolhida para a conta (mínimo 8 caracteres)',
            placeholder: 'Senha segura',
            isRequired: true
          },
          {
            id: 'provider',
            type: 'text',
            label: 'Provedor',
            description: 'Gmail',
            placeholder: 'Gmail',
            isRequired: true
          },
          {
            id: 'screenshot',
            type: 'screenshot',
            label: 'Comprovante de criação (opcional)',
            description: 'Screenshot da confirmação de conta criada',
            placeholder: '',
            isRequired: false
          }
        ]
      },
      {
        name: 'Criação de E-mail Outlook',
        description: 'Criar conta de e-mail no Outlook/Hotmail com credenciais válidas. Freelancer deve fazer logout antes de enviar.',
        category: 'Web',
        subcategory: 'Criar E-mail',
        platform: 'web-criar-email',
        taskType: 'email_creation',
        defaultBounty: 150,
        defaultTimeEstimate: 10,
        defaultInstructions: 'Criar uma conta de e-mail no Outlook seguindo os requisitos especificados. Após criar a conta, faça logout completo antes de enviar as credenciais.',
        isActive: true,
        emailCreation: {
          provider: 'outlook',
          quantity: 1,
          requirements: 'E-mail deve seguir o formato: nome.sobrenome@outlook.com'
        },
        proofRequirements: [
          {
            id: 'email',
            type: 'text',
            label: 'E-mail criado',
            description: 'Digite o endereço de e-mail completo criado',
            placeholder: 'exemplo@outlook.com',
            isRequired: true
          },
          {
            id: 'password',
            type: 'text',
            label: 'Senha da conta',
            description: 'Digite a senha escolhida para a conta (mínimo 8 caracteres)',
            placeholder: 'Senha segura',
            isRequired: true
          },
          {
            id: 'provider',
            type: 'text',
            label: 'Provedor',
            description: 'Outlook',
            placeholder: 'Outlook',
            isRequired: true
          },
          {
            id: 'screenshot',
            type: 'screenshot',
            label: 'Comprovante de criação (opcional)',
            description: 'Screenshot da confirmação de conta criada',
            placeholder: '',
            isRequired: false
          }
        ]
      },
      {
        name: 'Criação de E-mail Yahoo',
        description: 'Criar conta de e-mail no Yahoo com credenciais válidas. Freelancer deve fazer logout antes de enviar.',
        category: 'Web',
        subcategory: 'Criar E-mail',
        platform: 'web-criar-email',
        taskType: 'email_creation',
        defaultBounty: 150,
        defaultTimeEstimate: 10,
        defaultInstructions: 'Criar uma conta de e-mail no Yahoo seguindo os requisitos especificados. Após criar a conta, faça logout completo antes de enviar as credenciais.',
        isActive: true,
        emailCreation: {
          provider: 'yahoo',
          quantity: 1,
          requirements: 'E-mail deve seguir o formato: nomesobrenome@yahoo.com'
        },
        proofRequirements: [
          {
            id: 'email',
            type: 'text',
            label: 'E-mail criado',
            description: 'Digite o endereço de e-mail completo criado',
            placeholder: 'exemplo@yahoo.com',
            isRequired: true
          },
          {
            id: 'password',
            type: 'text',
            label: 'Senha da conta',
            description: 'Digite a senha escolhida para a conta (mínimo 8 caracteres)',
            placeholder: 'Senha segura',
            isRequired: true
          },
          {
            id: 'provider',
            type: 'text',
            label: 'Provedor',
            description: 'Yahoo',
            placeholder: 'Yahoo',
            isRequired: true
          },
          {
            id: 'screenshot',
            type: 'screenshot',
            label: 'Comprovante de criação (opcional)',
            description: 'Screenshot da confirmação de conta criada',
            placeholder: '',
            isRequired: false
          }
        ]
      },
      {
        name: 'Criação de E-mail ProtonMail',
        description: 'Criar conta de e-mail segura no ProtonMail com credenciais válidas. Freelancer deve fazer logout antes de enviar.',
        category: 'Web',
        subcategory: 'Criar E-mail',
        platform: 'web-criar-email',
        taskType: 'email_creation',
        defaultBounty: 200,
        defaultTimeEstimate: 15,
        defaultInstructions: 'Criar uma conta de e-mail no ProtonMail seguindo os requisitos especificados. Após criar a conta, faça logout completo antes de enviar as credenciais.',
        isActive: true,
        emailCreation: {
          provider: 'protonmail',
          quantity: 1,
          requirements: 'E-mail deve seguir o formato: nomesobrenome@proton.me'
        },
        proofRequirements: [
          {
            id: 'email',
            type: 'text',
            label: 'E-mail criado',
            description: 'Digite o endereço de e-mail completo criado',
            placeholder: 'exemplo@proton.me',
            isRequired: true
          },
          {
            id: 'password',
            type: 'text',
            label: 'Senha da conta',
            description: 'Digite a senha escolhida para a conta (mínimo 8 caracteres)',
            placeholder: 'Senha segura',
            isRequired: true
          },
          {
            id: 'provider',
            type: 'text',
            label: 'Provedor',
            description: 'ProtonMail',
            placeholder: 'ProtonMail',
            isRequired: true
          },
          {
            id: 'screenshot',
            type: 'screenshot',
            label: 'Comprovante de criação (opcional)',
            description: 'Screenshot da confirmação de conta criada',
            placeholder: '',
            isRequired: false
          }
        ]
      }
    ];
  }

  static async seedEmailCreationTemplates(): Promise<void> {
    const templates = this.getEmailCreationTemplates();
    
    for (const template of templates) {
      // Check if template already exists
      const existing = await getDocs(
        query(
          collection(db, this.collectionName),
          where('name', '==', template.name)
        )
      );
      
      if (existing.empty) {
        await this.createTemplate(template);
      }
    }
  }

  // YouTube templates
  static getYouTubeTemplates(): Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>[] {
    return [
      {
        name: 'Assistir Vídeo no YouTube',
        description: 'Assistir vídeo completo no YouTube e fornecer comprovante',
        category: 'Redes Sociais',
        subcategory: 'Visualização de vídeos no YouTube',
        platform: 'YouTube',
        taskType: 'watch',
        defaultBounty: 30,
        defaultTimeEstimate: 5,
        defaultInstructions: 'Assista ao vídeo completo do YouTube indicado. Certifique-se de assistir até o final para validação.',
        isActive: true,
        proofRequirements: [
          {
            id: 'screenshot',
            type: 'screenshot',
            label: 'Screenshot do vídeo assistido',
            description: 'Capture a tela mostrando o vídeo finalizado',
            placeholder: '',
            isRequired: true
          }
        ]
      },
      {
        name: 'Inscrever-se no Canal YouTube',
        description: 'Inscrever-se em canal do YouTube e fornecer comprovante',
        category: 'Redes Sociais',
        subcategory: 'Inscrições no YouTube',
        platform: 'youtube-subscribe',
        taskType: 'subscribe',
        defaultBounty: 50,
        defaultTimeEstimate: 3,
        defaultInstructions: 'Inscreva-se no canal do YouTube indicado. Clique no botão de inscrever-se e ative o sininho de notificações.',
        isActive: true,
        proofRequirements: [
          {
            id: 'screenshot',
            type: 'screenshot',
            label: 'Screenshot da inscrição',
            description: 'Mostre que você está inscrito no canal',
            placeholder: '',
            isRequired: true
          }
        ]
      },
      {
        name: 'Curtir Vídeo no YouTube',
        description: 'Curtir vídeo específico no YouTube',
        category: 'Redes Sociais',
        subcategory: 'Curtir vídeos no YouTube',
        platform: 'youtube-like',
        taskType: 'like',
        defaultBounty: 25,
        defaultTimeEstimate: 2,
        defaultInstructions: 'Curta o vídeo do YouTube clicando no botão de like (👍).',
        isActive: true,
        proofRequirements: [
          {
            id: 'screenshot',
            type: 'screenshot',
            label: 'Screenshot do like',
            description: 'Mostre o botão de like ativado no vídeo',
            placeholder: '',
            isRequired: true
          }
        ]
      }
    ];
  }

  static async seedYouTubeTemplates(): Promise<void> {
    const templates = this.getYouTubeTemplates();
    
    for (const template of templates) {
      const existing = await getDocs(
        query(
          collection(db, this.collectionName),
          where('name', '==', template.name)
        )
      );
      
      if (existing.empty) {
        await this.createTemplate(template);
      }
    }
  }

  // Facebook templates
  static getFacebookTemplates(): Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>[] {
    return [
      {
        name: 'Curtir Página no Facebook',
        description: 'Curtir página do Facebook e fornecer comprovante',
        category: 'Redes Sociais',
        subcategory: 'Curtir publicação no Facebook',
        platform: 'facebook-like',
        taskType: 'like',
        defaultBounty: 40,
        defaultTimeEstimate: 3,
        defaultInstructions: 'Acesse a página do Facebook indicada e clique em "Curtir".',
        isActive: true,
        proofRequirements: [
          {
            id: 'screenshot',
            type: 'screenshot',
            label: 'Screenshot da página curtida',
            description: 'Mostre que você curtiu a página',
            placeholder: '',
            isRequired: true
          }
        ]
      },
      {
        name: 'Seguir Página no Facebook',
        description: 'Seguir página do Facebook e fornecer comprovante',
        category: 'Redes Sociais',
        subcategory: 'Seguir página no Facebook',
        platform: 'facebook-follow',
        taskType: 'follow',
        defaultBounty: 45,
        defaultTimeEstimate: 3,
        defaultInstructions: 'Acesse a página do Facebook indicada e clique em "Seguir".',
        isActive: true,
        proofRequirements: [
          {
            id: 'screenshot',
            type: 'screenshot',
            label: 'Screenshot seguindo página',
            description: 'Mostre que você está seguindo a página',
            placeholder: '',
            isRequired: true
          }
        ]
      },
      {
        name: 'Comentar Publicação no Facebook',
        description: 'Comentar em publicação do Facebook',
        category: 'Redes Sociais',
        subcategory: 'Comentar no Facebook',
        platform: 'facebook-comment',
        taskType: 'comment',
        defaultBounty: 60,
        defaultTimeEstimate: 5,
        defaultInstructions: 'Comente na publicação do Facebook indicada com um comentário relevante e respeitoso.',
        isActive: true,
        proofRequirements: [
          {
            id: 'comment_text',
            type: 'text',
            label: 'Texto do comentário',
            description: 'Digite o comentário que você fez',
            placeholder: 'Seu comentário aqui...',
            isRequired: true
          },
          {
            id: 'screenshot',
            type: 'screenshot',
            label: 'Screenshot do comentário',
            description: 'Mostre seu comentário publicado',
            placeholder: '',
            isRequired: true
          }
        ]
      },
      {
        name: 'Compartilhar Publicação no Facebook',
        description: 'Compartilhar publicação do Facebook',
        category: 'Redes Sociais',
        subcategory: 'Compartilhar no Facebook',
        platform: 'facebook-share',
        taskType: 'share',
        defaultBounty: 55,
        defaultTimeEstimate: 4,
        defaultInstructions: 'Compartilhe a publicação do Facebook indicada em seu perfil ou em grupo.',
        isActive: true,
        proofRequirements: [
          {
            id: 'screenshot',
            type: 'screenshot',
            label: 'Screenshot do compartilhamento',
            description: 'Mostre a publicação compartilhada',
            placeholder: '',
            isRequired: true
          }
        ]
      }
    ];
  }

  static async seedFacebookTemplates(): Promise<void> {
    const templates = this.getFacebookTemplates();
    
    for (const template of templates) {
      const existing = await getDocs(
        query(
          collection(db, this.collectionName),
          where('name', '==', template.name)
        )
      );
      
      if (existing.empty) {
        await this.createTemplate(template);
      }
    }
  }

  // Instagram templates
  static getInstagramTemplates(): Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>[] {
    return [
      {
        name: 'Seguir Perfil no Instagram',
        description: 'Seguir perfil do Instagram e fornecer comprovante',
        category: 'Redes Sociais',
        subcategory: 'Seguir perfil no Instagram',
        platform: 'instagram-follow',
        taskType: 'follow',
        defaultBounty: 45,
        defaultTimeEstimate: 3,
        defaultInstructions: 'Acesse o perfil do Instagram indicado e clique em "Seguir".',
        isActive: true,
        proofRequirements: [
          {
            id: 'screenshot',
            type: 'screenshot',
            label: 'Screenshot seguindo perfil',
            description: 'Mostre que você está seguindo o perfil',
            placeholder: '',
            isRequired: true
          }
        ]
      },
      {
        name: 'Curtir Publicação no Instagram',
        description: 'Curtir publicação do Instagram',
        category: 'Redes Sociais',
        subcategory: 'Curtir publicação no Instagram',
        platform: 'instagram-like',
        taskType: 'like',
        defaultBounty: 30,
        defaultTimeEstimate: 2,
        defaultInstructions: 'Curta a publicação do Instagram clicando no ícone de coração.',
        isActive: true,
        proofRequirements: [
          {
            id: 'screenshot',
            type: 'screenshot',
            label: 'Screenshot da curtida',
            description: 'Mostre a publicação curtida',
            placeholder: '',
            isRequired: true
          }
        ]
      }
    ];
  }

  static async seedInstagramTemplates(): Promise<void> {
    const templates = this.getInstagramTemplates();
    
    for (const template of templates) {
      const existing = await getDocs(
        query(
          collection(db, this.collectionName),
          where('name', '==', template.name)
        )
      );
      
      if (existing.empty) {
        await this.createTemplate(template);
      }
    }
  }

  // TikTok templates
  static getTikTokTemplates(): Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>[] {
    return [
      {
        name: 'Seguir Perfil no TikTok',
        description: 'Seguir perfil do TikTok e fornecer comprovante',
        category: 'Redes Sociais',
        subcategory: 'Seguir perfil no TikTok',
        platform: 'tiktok-follow',
        taskType: 'follow',
        defaultBounty: 45,
        defaultTimeEstimate: 3,
        defaultInstructions: 'Acesse o perfil do TikTok indicado e clique em "Seguir".',
        isActive: true,
        proofRequirements: [
          {
            id: 'screenshot',
            type: 'screenshot',
            label: 'Screenshot seguindo perfil',
            description: 'Mostre que você está seguindo o perfil',
            placeholder: '',
            isRequired: true
          }
        ]
      },
      {
        name: 'Curtir Vídeo no TikTok',
        description: 'Curtir vídeo do TikTok',
        category: 'Redes Sociais',
        subcategory: 'Curtir vídeo no TikTok',
        platform: 'tiktok-like',
        taskType: 'like',
        defaultBounty: 30,
        defaultTimeEstimate: 2,
        defaultInstructions: 'Curta o vídeo do TikTok clicando no ícone de coração.',
        isActive: true,
        proofRequirements: [
          {
            id: 'screenshot',
            type: 'screenshot',
            label: 'Screenshot da curtida',
            description: 'Mostre o vídeo curtido',
            placeholder: '',
            isRequired: true
          }
        ]
      },
      {
        name: 'Assistir Vídeo no TikTok',
        description: 'Assistir vídeo completo no TikTok',
        category: 'Redes Sociais',
        subcategory: 'Assistir vídeo no TikTok',
        platform: 'tiktok-watch',
        taskType: 'watch',
        defaultBounty: 35,
        defaultTimeEstimate: 3,
        defaultInstructions: 'Assista ao vídeo do TikTok indicado até o final.',
        isActive: true,
        proofRequirements: [
          {
            id: 'screenshot',
            type: 'screenshot',
            label: 'Screenshot do vídeo',
            description: 'Mostre que você assistiu ao vídeo',
            placeholder: '',
            isRequired: true
          }
        ]
      }
    ];
  }

  static async seedTikTokTemplates(): Promise<void> {
    const templates = this.getTikTokTemplates();
    
    for (const template of templates) {
      const existing = await getDocs(
        query(
          collection(db, this.collectionName),
          where('name', '==', template.name)
        )
      );
      
      if (existing.empty) {
        await this.createTemplate(template);
      }
    }
  }

  // Website/Web templates
  static getWebsiteTemplates(): Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>[] {
    return [
      {
        name: 'Visitar Website',
        description: 'Visitar website específico e navegar',
        category: 'Web',
        subcategory: 'Outras tarefas',
        platform: 'web-website',
        taskType: 'visit',
        defaultBounty: 25,
        defaultTimeEstimate: 3,
        defaultInstructions: 'Visite o website indicado e navegue por pelo menos 2 minutos.',
        isActive: true,
        proofRequirements: [
          {
            id: 'screenshot',
            type: 'screenshot',
            label: 'Screenshot do website',
            description: 'Mostre que você visitou o website',
            placeholder: '',
            isRequired: true
          }
        ]
      },
      {
        name: 'Visitar e Rolar Website',
        description: 'Visitar website e rolar até o final da página',
        category: 'Web',
        subcategory: 'Outras tarefas',
        platform: 'web-website',
        taskType: 'visit_scroll',
        defaultBounty: 30,
        defaultTimeEstimate: 4,
        defaultInstructions: 'Visite o website indicado e role a página até o final para visualizar todo o conteúdo.',
        isActive: true,
        proofRequirements: [
          {
            id: 'screenshot',
            type: 'screenshot',
            label: 'Screenshot do rodapé',
            description: 'Mostre o rodapé do website para comprovar que rolou até o final',
            placeholder: '',
            isRequired: true
          }
        ]
      }
    ];
  }

  static async seedWebsiteTemplates(): Promise<void> {
    const templates = this.getWebsiteTemplates();
    
    for (const template of templates) {
      const existing = await getDocs(
        query(
          collection(db, this.collectionName),
          where('name', '==', template.name)
        )
      );
      
      if (existing.empty) {
        await this.createTemplate(template);
      }
    }
  }

  // ============= Twitter/X Templates =============
  static getTwitterTemplates(): Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>[] {
    return [
      {
        name: 'Seguir Perfil no Twitter/X',
        description: 'Tarefa para ganhar seguidores no Twitter/X',
        category: 'Social',
        subcategory: 'Twitter/X',
        platform: 'twitter-follow',
        taskType: 'follow',
        defaultBounty: 50,
        defaultTimeEstimate: 2,
        defaultInstructions: '1. Acesse o perfil no Twitter/X\n2. Clique em "Seguir"\n3. Aguarde confirmação\n4. Tire screenshot mostrando que está seguindo',
        isActive: true,
        proofRequirements: [
          {
            id: 'twitter_follow_screenshot',
            type: 'screenshot',
            label: 'Comprovativo de seguir (screenshot)',
            description: 'Screenshot mostrando que você seguiu o perfil',
            isRequired: true,
          },
          {
            id: 'twitter_profile_link',
            type: 'url',
            label: 'Link do perfil',
            description: 'Cole o link do perfil que seguiu',
            isRequired: true,
          },
        ],
      },
      {
        name: 'Curtir Tweet no Twitter/X',
        description: 'Tarefa para ganhar curtidas em tweets',
        category: 'Social',
        subcategory: 'Twitter/X',
        platform: 'twitter-like',
        taskType: 'like',
        defaultBounty: 30,
        defaultTimeEstimate: 1,
        defaultInstructions: '1. Abra o link do tweet\n2. Clique no coração para curtir\n3. Aguarde o coração ficar vermelho\n4. Tire screenshot da curtida',
        isActive: true,
        proofRequirements: [
          {
            id: 'twitter_like_screenshot',
            type: 'screenshot',
            label: 'Comprovativo de curtida (screenshot)',
            description: 'Screenshot mostrando que você curtiu o tweet',
            isRequired: true,
          },
          {
            id: 'twitter_tweet_link',
            type: 'url',
            label: 'Link do tweet',
            description: 'Cole o link do tweet que curtiu',
            isRequired: true,
          },
        ],
      },
      {
        name: 'Retweet no Twitter/X',
        description: 'Tarefa para ganhar retweets',
        category: 'Social',
        subcategory: 'Twitter/X',
        platform: 'twitter-retweet',
        taskType: 'retweet',
        defaultBounty: 40,
        defaultTimeEstimate: 2,
        defaultInstructions: '1. Abra o link do tweet\n2. Clique no ícone de retweet\n3. Confirme a ação\n4. Tire screenshot do retweet confirmado',
        isActive: true,
        proofRequirements: [
          {
            id: 'twitter_retweet_screenshot',
            type: 'screenshot',
            label: 'Comprovativo de retweet (screenshot)',
            description: 'Screenshot mostrando que você deu retweet',
            isRequired: true,
          },
          {
            id: 'twitter_tweet_link',
            type: 'url',
            label: 'Link do tweet',
            description: 'Cole o link do tweet que você retweetou',
            isRequired: true,
          },
          {
            id: 'twitter_profile_link',
            type: 'url',
            label: 'Link do seu perfil',
            description: 'Cole o link do seu perfil do Twitter/X',
            isRequired: false,
          },
        ],
      },
      {
        name: 'Comentar Tweet no Twitter/X',
        description: 'Tarefa para ganhar comentários em tweets',
        category: 'Social',
        subcategory: 'Twitter/X',
        platform: 'twitter-comment',
        taskType: 'comment',
        defaultBounty: 60,
        defaultTimeEstimate: 3,
        defaultInstructions: '1. Abra o link do tweet\n2. Escreva um comentário relevante (mínimo 50 caracteres)\n3. Publique o comentário\n4. Tire screenshot do comentário publicado',
        isActive: true,
        proofRequirements: [
          {
            id: 'twitter_comment_screenshot',
            type: 'screenshot',
            label: 'Comprovativo de comentário (screenshot)',
            description: 'Screenshot mostrando seu comentário publicado',
            isRequired: true,
          },
          {
            id: 'twitter_comment_text',
            type: 'text',
            label: 'Texto do comentário',
            description: 'Copie e cole o texto exato do seu comentário',
            isRequired: true,
          },
          {
            id: 'twitter_tweet_link',
            type: 'url',
            label: 'Link do tweet',
            description: 'Cole o link do tweet que você comentou',
            isRequired: true,
          },
          {
            id: 'twitter_comment_link',
            type: 'url',
            label: 'Link do seu comentário',
            description: 'Cole o link do seu comentário (opcional)',
            isRequired: false,
          },
        ],
      },
    ];
  }

  static async seedTwitterTemplates(): Promise<void> {
    const templates = this.getTwitterTemplates();
    
    for (const template of templates) {
      const existing = await getDocs(
        query(
          collection(db, this.collectionName),
          where('name', '==', template.name)
        )
      );
      
      if (existing.empty) {
        await this.createTemplate(template);
      }
    }
  }
}
