import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Play,
  ThumbsUp,
  UserPlus,
  MessageSquare,
  Eye,
  Camera,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  taskType: string;
  goodExample: {
    title: string;
    description: string;
    tips: string[];
  };
  badExample: {
    title: string;
    description: string;
    warnings: string[];
  };
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Bem-vindo ao Tutorial!',
    description: 'Vamos aprender como completar tarefas corretamente e garantir que suas provas sejam aprovadas.',
    icon: <Lightbulb className="h-12 w-12 text-primary" />,
    taskType: 'introduction',
    goodExample: {
      title: '✅ O que você vai aprender',
      description: 'Este tutorial irá te mostrar:',
      tips: [
        'Como identificar diferentes tipos de tarefas',
        'Quais provas são aceitas e rejeitadas',
        'Dicas para ter suas tarefas aprovadas rapidamente',
        'Erros comuns que você deve evitar',
      ],
    },
    badExample: {
      title: '⚠️ Importante saber',
      description: 'Pontos de atenção:',
      warnings: [
        'Provas falsas ou editadas resultam em rejeição',
        'Você deve completar TODAS as etapas da tarefa',
        'Screenshots devem ser claros e legíveis',
        'Respeite sempre as instruções do contratante',
      ],
    },
  },
  {
    title: 'Tarefas de Vídeo (YouTube/TikTok)',
    description: 'Aprenda como assistir vídeos e enviar provas corretas.',
    icon: <Play className="h-12 w-12 text-red-500" />,
    taskType: 'video',
    goodExample: {
      title: '✅ Prova ACEITA',
      description: 'Screenshot mostrando:',
      tips: [
        '📱 O vídeo completo na tela',
        '⏱️ Tempo de visualização visível (se aplicável)',
        '✓ Título do vídeo claramente legível',
        '✓ Nome do canal/criador visível',
        '✓ Screenshot tirado durante a reprodução',
      ],
    },
    badExample: {
      title: '❌ Prova REJEITADA',
      description: 'Evite enviar:',
      warnings: [
        '🚫 Screenshot com vídeo pausado no início (0:00)',
        '🚫 Imagem cortada ou ilegível',
        '🚫 Screenshot de outro vídeo/canal',
        '🚫 Vídeo não assistido completamente',
        '🚫 Edição ou manipulação da imagem',
      ],
    },
  },
  {
    title: 'Seguir Perfis/Páginas',
    description: 'Como provar que você seguiu um perfil ou página.',
    icon: <UserPlus className="h-12 w-12 text-blue-500" />,
    taskType: 'follow',
    goodExample: {
      title: '✅ Prova ACEITA',
      description: 'Screenshot mostrando:',
      tips: [
        '✓ Botão "Seguindo" ou "Following" ATIVO',
        '✓ Nome do perfil/página claramente visível',
        '✓ Sua foto de perfil visível (prova que é você)',
        '✓ Interface completa da rede social',
        '✓ Sem cortes ou edições',
      ],
    },
    badExample: {
      title: '❌ Prova REJEITADA',
      description: 'Evite enviar:',
      warnings: [
        '🚫 Botão "Seguir" ainda não clicado',
        '🚫 Screenshot de perfil diferente',
        '🚫 Imagem cortada ocultando informações',
        '🚫 Conta fake ou secundária (se não permitido)',
        '🚫 Screenshot editado ou manipulado',
      ],
    },
  },
  {
    title: 'Curtir Posts/Fotos',
    description: 'Como enviar prova de curtida corretamente.',
    icon: <ThumbsUp className="h-12 w-12 text-pink-500" />,
    taskType: 'like',
    goodExample: {
      title: '✅ Prova ACEITA',
      description: 'Screenshot mostrando:',
      tips: [
        '❤️ Coração/like VERMELHO ou ATIVO',
        '✓ Conteúdo do post visível',
        '✓ Nome do autor/página visível',
        '✓ Data/hora do post (se possível)',
        '✓ Interface completa sem cortes',
      ],
    },
    badExample: {
      title: '❌ Prova REJEITADA',
      description: 'Evite enviar:',
      warnings: [
        '🚫 Like ainda não dado (coração vazio)',
        '🚫 Post diferente do solicitado',
        '🚫 Screenshot muito cortado',
        '🚫 Imagem de baixa qualidade',
        '🚫 Like dado e depois removido',
      ],
    },
  },
  {
    title: 'Comentar em Posts',
    description: 'Como fazer comentários que serão aprovados.',
    icon: <MessageSquare className="h-12 w-12 text-green-500" />,
    taskType: 'comment',
    goodExample: {
      title: '✅ Comentário ACEITO',
      description: 'Seu comentário deve:',
      tips: [
        '✓ Ser relevante ao conteúdo do post',
        '✓ Ter mínimo de 10-15 caracteres',
        '✓ Estar em português correto',
        '✓ Ser respeitoso e genuíno',
        '✓ Screenshot mostrando comentário PUBLICADO',
      ],
    },
    badExample: {
      title: '❌ Comentário REJEITADO',
      description: 'Evite:',
      warnings: [
        '🚫 Spam ou comentários genéricos ("Legal", "Top")',
        '🚫 Comentários ofensivos ou inadequados',
        '🚫 Texto copiado de outros comentários',
        '🚫 Emojis sem texto',
        '🚫 Comentário ainda não publicado',
      ],
    },
  },
  {
    title: 'Dicas Finais de Sucesso',
    description: 'Maximize suas chances de aprovação.',
    icon: <CheckCircle className="h-12 w-12 text-success" />,
    taskType: 'tips',
    goodExample: {
      title: '🎯 Boas Práticas',
      description: 'Faça sempre:',
      tips: [
        '📖 Leia TODAS as instruções antes de começar',
        '⏰ Complete a tarefa no tempo estimado',
        '📸 Tire screenshots de ALTA QUALIDADE',
        '✅ Verifique se todas as provas estão corretas',
        '💬 Entre em contato em caso de dúvida',
      ],
    },
    badExample: {
      title: '⚠️ Evite Estes Erros',
      description: 'Nunca faça:',
      warnings: [
        '🚫 Enviar provas falsas ou editadas',
        '🚫 Pular etapas das instruções',
        '🚫 Usar contas fake (se não permitido)',
        '🚫 Submeter sem completar a tarefa',
        '🚫 Ser desrespeitoso nos comentários',
      ],
    },
  },
];

export const TaskTutorial = () => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkTutorialStatus();
  }, [currentUser]);

  const checkTutorialStatus = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const tutorialRef = doc(db, 'users', currentUser.uid);
      const tutorialDoc = await getDoc(tutorialRef);
      const userData = tutorialDoc.data();

      // Se o usuário nunca viu o tutorial, mostrar
      if (!userData?.tutorialCompleted) {
        setOpen(true);
      }
    } catch (error) {
      console.error('Error checking tutorial status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!currentUser) return;

    try {
      const tutorialRef = doc(db, 'users', currentUser.uid);
      await setDoc(
        tutorialRef,
        {
          tutorialCompleted: true,
          tutorialCompletedAt: new Date(),
        },
        { merge: true }
      );
      setOpen(false);
    } catch (error) {
      console.error('Error saving tutorial status:', error);
    }
  };

  const handleSkip = async () => {
    if (!currentUser) {
      setOpen(false);
      return;
    }

    try {
      const tutorialRef = doc(db, 'users', currentUser.uid);
      await setDoc(
        tutorialRef,
        {
          tutorialCompleted: true,
          tutorialSkipped: true,
          tutorialCompletedAt: new Date(),
        },
        { merge: true }
      );
      setOpen(false);
    } catch (error) {
      console.error('Error skipping tutorial:', error);
      setOpen(false);
    }
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;
  const step = tutorialSteps[currentStep];

  if (loading || !currentUser) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {step.icon}
              <div>
                <DialogTitle className="text-xl sm:text-2xl">
                  {step.title}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {step.description}
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="ml-auto">
              {currentStep + 1} / {tutorialSteps.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 my-6">
          {/* Good Example */}
          <Card className="p-6 border-2 border-success/30 bg-success/5 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-6 w-6 text-success" />
              <h3 className="font-bold text-lg text-success">
                {step.goodExample.title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {step.goodExample.description}
            </p>
            <ul className="space-y-2">
              {step.goodExample.tips.map((tip, index) => (
                <li
                  key={index}
                  className="text-sm flex items-start gap-2 text-foreground"
                >
                  <span className="text-success mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Bad Example */}
          <Card className="p-6 border-2 border-destructive/30 bg-destructive/5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="h-6 w-6 text-destructive" />
              <h3 className="font-bold text-lg text-destructive">
                {step.badExample.title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {step.badExample.description}
            </p>
            <ul className="space-y-2">
              {step.badExample.warnings.map((warning, index) => (
                <li
                  key={index}
                  className="text-sm flex items-start gap-2 text-foreground"
                >
                  <span className="text-destructive mt-0.5">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Tips Section */}
        {currentStep === 0 && (
          <Card className="p-4 bg-primary/5 border-primary/20 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-primary mb-1">
                  💡 Dica Importante
                </p>
                <p className="text-sm text-muted-foreground">
                  Complete este tutorial para entender como fazer tarefas corretamente
                  e aumentar suas chances de aprovação. Você pode rever este tutorial
                  a qualquer momento nas configurações.
                </p>
              </div>
            </div>
          </Card>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2">
          <div className="flex gap-2 justify-between sm:justify-start w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1 sm:flex-initial"
            >
              Pular Tutorial
            </Button>
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex-1 sm:flex-initial"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
          </div>

          <Button
            onClick={nextStep}
            className="w-full sm:w-auto sm:ml-auto"
            variant={currentStep === tutorialSteps.length - 1 ? 'default' : 'default'}
          >
            {currentStep === tutorialSteps.length - 1 ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Concluir Tutorial
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
