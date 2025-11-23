import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { LevelService } from '@/services/levelService';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Trophy, Zap, Star, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const XPDisplay: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [xp, setXP] = useState(0);
  const [level, setLevel] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadXP = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const data = await LevelService.getUserXP(currentUser.uid);
        setXP(data.xp);
        setLevel(data.level);
      } finally {
        setLoading(false);
      }
    };
    loadXP();
  }, [currentUser]);

  if (!currentUser) return null;

  if (loading) {
    return (
      <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Sistema de XP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-4 w-1/2 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const levelName = LevelService.getLevelName(level);
  const nextLevelXP = LevelService.getXPForNextLevel(xp);
  const currentLevelXP = level === 0 ? 0 : LevelService.getXPForNextLevel(xp - 1);
  const xpInCurrentLevel = xp - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  const progressPercent = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100));

  return (
    <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-glow">
      {/* Decoração de fundo */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary animate-pulse" />
            Nível {level}
          </CardTitle>
          <Badge className="bg-gradient-to-r from-primary to-accent text-white border-0 shadow-glow">
            <Star className="w-3 h-3 mr-1" />
            {levelName}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-4">
        {/* Barra de progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Zap className="w-4 h-4 text-warning" />
              {xp} XP
            </span>
            <span className="text-muted-foreground">
              {nextLevelXP - xp} XP para próximo nível
            </span>
          </div>
          
          <div className="relative">
            <Progress value={progressPercent} className="h-3" />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference">
              {progressPercent}%
            </div>
          </div>
        </div>

        {/* Dica de XP */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">💡 Dica para ganhar XP:</p>
              <p>• Avalie tarefas concluídas: <span className="text-primary font-semibold">+30-50 XP</span></p>
              <p>• Avaliações 4-5 estrelas dão mais XP!</p>
            </div>
          </div>
        </div>

        {/* Info adicional */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-success/10 border border-success/20 rounded-lg p-2">
            <div className="text-xs text-muted-foreground">Total de XP</div>
            <div className="text-lg font-bold text-success">{xp}</div>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-2">
            <div className="text-xs text-muted-foreground">Próximo Nível</div>
            <div className="text-lg font-bold text-primary">{level + 1}</div>
          </div>
        </div>

        {/* Botão Ver Estatísticas Completas */}
        <Button 
          variant="outline" 
          className="w-full mt-2 border-primary/20 hover:bg-primary/10"
          onClick={() => navigate('/stats')}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Ver Estatísticas Completas
        </Button>
      </CardContent>
    </Card>
  );
};

export default XPDisplay;
