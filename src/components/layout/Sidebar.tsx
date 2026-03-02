import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Shield, 
  Cpu, 
  ScrollText,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/organizations', icon: Building2, labelKey: 'nav.organizations' },
  { path: '/users', icon: Users, labelKey: 'nav.users' },
  { path: '/roles', icon: Shield, labelKey: 'nav.roles' },
  { path: '/agents', icon: Cpu, labelKey: 'nav.agents' },
  { path: '/audit-logs', icon: ScrollText, labelKey: 'nav.auditLogs' },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={cn(
          'fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity',
          collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
        onClick={onToggle}
      />
      
      {/* Sidebar */}
      <aside 
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300',
          collapsed ? 'w-[70px]' : 'w-[260px]',
          collapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        )}
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-sidebar-foreground truncate">InsightSage</h1>
                <p className="text-xs text-muted-foreground truncate">Admin Cockpit</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      'hover:bg-sidebar-accent hover:text-sidebar-foreground',
                      isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground'
                    )}
                    data-testid={`nav-${item.path.slice(1)}`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && (
                      <span className="truncate">{t(item.labelKey)}</span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <Separator className="bg-sidebar-border" />

        {/* Collapse button */}
        <div className="p-3 hidden lg:block">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              'w-full justify-center text-muted-foreground hover:text-foreground',
              !collapsed && 'justify-start'
            )}
            data-testid="sidebar-toggle"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>{t('common.collapse') || 'Réduire'}</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}
