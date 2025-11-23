import { 
  LayoutDashboard, 
  Users, 
  FileCheck, 
  Wallet, 
  BarChart3, 
  Settings, 
  Shield,
  MessageSquare,
  DollarSign,
  Store,
  Flag,
  ShoppingCart,
  Briefcase,
  UserCheck,
  Database,
  Globe,
  Bell,
  FlaskConical,
  MessageCircle,
  RefreshCw
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
  { title: "Usuários", url: "/admin?tab=users", icon: Users },
  { title: "Verificações", url: "/admin?tab=verifications", icon: FileCheck },
  { title: "Saques", url: "/admin?tab=withdrawals", icon: Wallet },
  { title: "Negociações Depósito", url: "/admin?tab=deposit-negotiations", icon: DollarSign },
  { title: "Criação de E-mails", url: "/admin?tab=email-creation", icon: MessageSquare },
  { title: "Analytics", url: "/admin?tab=analytics", icon: BarChart3 },
  { title: "Tarefas", url: "/admin?tab=jobs", icon: Briefcase },
  { title: "Tarefas Recorrentes", url: "/admin?tab=recurring-jobs", icon: RefreshCw },
  { title: "Reportes", url: "/admin?tab=reports", icon: Flag },
  { title: "Suporte", url: "/admin?tab=support", icon: MessageSquare },
  { title: "Fórum", url: "/admin?tab=forum", icon: MessageCircle },
  { title: "Templates Tarefas", url: "/admin?tab=templates", icon: FileCheck },
  { title: "Mercado", url: "/admin?tab=market", icon: Store },
  { title: "Pedidos Mercado", url: "/admin?tab=market-orders", icon: ShoppingCart },
  { title: "Afiliados", url: "/admin?tab=affiliates", icon: UserCheck },
  { title: "Banking", url: "/admin?tab=banking", icon: DollarSign },
  { title: "Taxonomia", url: "/admin?tab=taxonomy", icon: Database },
  { title: "Links Sociais", url: "/admin?tab=social-links", icon: Globe },
  { title: "Segurança", url: "/admin?tab=security", icon: Shield },
  { title: "Config. Sistema", url: "/admin?tab=system-config", icon: Settings },
  { title: "Histórico Broadcasts", url: "/admin?tab=broadcast-history", icon: Bell },
  { title: "Testes A/B", url: "/admin?tab=ab-testing", icon: FlaskConical },
  { title: "Configurações", url: "/admin?tab=settings", icon: Settings },
];

export function AdminSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname + location.search;

  const isActive = (url: string) => {
    if (url === "/admin") {
      return currentPath === "/admin" || currentPath === "/admin?tab=overview";
    }
    return currentPath === url;
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-card">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Administração
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url} 
                      end={item.end}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent/50"
                      activeClassName="bg-primary/10 text-primary font-medium hover:bg-primary/20"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {open && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
