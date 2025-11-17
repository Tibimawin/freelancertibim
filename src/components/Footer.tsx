import { Link } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/contexts/ThemeContext';
import { Mail, Rss, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminService } from '@/services/admin';

const Footer = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [links, setLinks] = useState<{ email?: string; rss?: string; facebook?: string; twitter?: string; instagram?: string; linkedin?: string }>({});

  useEffect(() => {
    (async () => {
      const rs = await AdminService.getSocialLinks();
      setLinks(rs);
    })();
  }, []);

  const handleToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <footer className="mt-10 border-t bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-muted-foreground">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-semibold">F</span>
            </div>
            <span className="font-semibold text-foreground">Freelincer</span>
          </div>

          <nav className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3">
            <Link to="/sobre-nos" className="hover:text-foreground">Sobre nós</Link>
            <Link to="/referral" className="hover:text-foreground">Programa de Referência</Link>
            <Link to="/faq" className="hover:text-foreground">Perguntas frequentes</Link>
            <Link to="/terms" className="hover:text-foreground">Termos de Uso</Link>
            <Link to="/privacy" className="hover:text-foreground">Política de Privacidade</Link>
          </nav>
        </div>

        <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-xs">&copy; 2025 Freelincer.com. Todos os direitos reservados.</p>
          <div className="flex items-center gap-2 text-xs">
            <span>modo escuro</span>
            <span className={!isDark ? 'text-foreground' : ''}>fora</span>
            <Switch checked={isDark} onCheckedChange={handleToggle} />
            <span className={isDark ? 'text-foreground' : ''}>em</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <a href={links.email || 'mailto:suporte@freelincer.com'} className="hover:text-foreground" aria-label="Email" target={links.email?.startsWith('http') ? '_blank' : undefined}><Mail size={18} /></a>
          <a href={links.rss || '#'} className="hover:text-foreground" aria-label="Blog" target="_blank" rel="noreferrer"><Rss size={18} /></a>
          <a href={links.facebook || '#'} className="hover:text-foreground" aria-label="Facebook" target="_blank" rel="noreferrer"><Facebook size={18} /></a>
          <a href={links.twitter || '#'} className="hover:text-foreground" aria-label="Twitter" target="_blank" rel="noreferrer"><Twitter size={18} /></a>
          <a href={links.instagram || '#'} className="hover:text-foreground" aria-label="Instagram" target="_blank" rel="noreferrer"><Instagram size={18} /></a>
          <a href={links.linkedin || '#'} className="hover:text-foreground" aria-label="LinkedIn" target="_blank" rel="noreferrer"><Linkedin size={18} /></a>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed">
          Aviso Legal: A Freelincer não será tratada como editora ou palestrante de nenhuma informação
          fornecida por editores de empregos.
        </p>
      </div>
    </footer>
  );
};

export default Footer;