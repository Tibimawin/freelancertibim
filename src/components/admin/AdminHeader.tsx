import { Button } from '@/components/ui/button';
import ModeToggle from '@/components/ModeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { LogOut, Shield, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const AdminHeader = () => {
  const { signOut } = useAuth();
  const { adminData } = useAdmin();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Painel Administrativo</h1>
            </div>
            
            {adminData && (
              <div className="text-sm text-muted-foreground">
                Bem-vindo, {adminData.name}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link to="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Site Principal
              </Link>
            </Button>
            
            <ModeToggle />
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;