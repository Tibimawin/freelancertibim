import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AdminService } from '@/services/admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Props = { children: React.ReactNode };

const MaintenanceGuard: React.FC<Props> = ({ children }) => {
  const [status, setStatus] = useState<{ maintenance: boolean; message?: string } | null>(null);
  const location = useLocation();

  useEffect(() => {
    (async () => {
      const st = await AdminService.getSiteStatus();
      setStatus(st);
    })();
  }, []);

  if (!status) return <>{children}</>;

  const path = location.pathname || '/';
  const params = new URLSearchParams(location.search);
  const safeMode = params.get('safeMode') === '1';
  if (!safeMode && status.maintenance && !path.startsWith('/admin')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Site em Manutenção</CardTitle>
            <CardDescription>{status.message || 'Estamos temporariamente em manutenção. Tente novamente mais tarde.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default MaintenanceGuard;
