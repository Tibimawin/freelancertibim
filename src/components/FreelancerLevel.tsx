import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LevelResult, LevelService } from '@/services/levelService';
import { useAuth } from '@/contexts/AuthContext';
import { Award, TrendingUp, AlertTriangle } from 'lucide-react';

const FreelancerLevel: React.FC = () => {
  const { currentUser } = useAuth();
  const [result, setResult] = useState<LevelResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const rs = await LevelService.getUserLevel(currentUser.uid);
        setResult(rs);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [currentUser]);

  if (!currentUser) return null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Nível Freelancer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-4 w-1/2 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  const { level, points, nextLevelAt, progressToNext, breakdown } = result;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Award className="w-4 h-4 text-primary" />
          Nível Freelancer: <span className="font-semibold">{level}</span>
        </CardTitle>
        <div className="text-xs text-muted-foreground">{points} pts</div>
      </CardHeader>
      <CardContent>
        {nextLevelAt !== null ? (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Progresso para próximo nível</span>
              <span>{progressToNext}%</span>
            </div>
            <Progress value={progressToNext} />
            <div className="text-xs text-muted-foreground mt-1">Próximo nível em {nextLevelAt} pts</div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <TrendingUp className="w-3 h-3" />
            Nível máximo atingido
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded border border-border">
            <div className="font-medium">Trabalhos</div>
            <div className="mt-1 text-muted-foreground">Iniciais: {breakdown.tasksInitial}</div>
            <div className="text-muted-foreground">Avançados: {breakdown.tasksAdvanced}</div>
            <div className="text-muted-foreground">Especializados: {breakdown.tasksSpecialized}</div>
          </div>
          <div className="p-2 rounded border border-border">
            <div className="font-medium">Desempenho</div>
            <div className="mt-1 text-muted-foreground">Excelentes: {breakdown.excellentCount}</div>
            <div className="text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Não satisfeitas: {breakdown.notSatisfiedCount}</div>
            <div className="text-muted-foreground">Inatividade: {breakdown.inactivityWeeks} sem.</div>
          </div>
        </div>

      <div className="text-xs text-muted-foreground mt-3">Ganhos acumulados: {Math.round(breakdown.earningsKZ)} Kz</div>
      </CardContent>
    </Card>
  );
};

export default FreelancerLevel;