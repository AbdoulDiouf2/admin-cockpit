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
  HeartPulse,
  CreditCard,
  BarChart3,
  Calendar,
  Brain,
  Settings,
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
  { path: '/invitations', icon: Calendar, labelKey: 'nav.invitations' },
  { path: '/roles', icon: Shield, labelKey: 'nav.roles' },
  { path: '/subscription-plans', icon: CreditCard, labelKey: 'nav.subscriptionPlans' },
  { path: '/client-plans', icon: CreditCard, labelKey: 'nav.clientPlans' },
  { path: '/billing-subscriptions', icon: CreditCard, labelKey: 'nav.billingSubscriptions' },
  { path: '/dashboards', icon: LayoutDashboard, labelKey: 'nav.clientDashboards' },
  { path: '/kpi-store', icon: BarChart3, labelKey: 'nav.kpiStore' },
  { path: '/nlq-store', icon: Brain, labelKey: 'nav.nlqStore' },
  { path: '/agents', icon: Cpu, labelKey: 'nav.agents' },
  { path: '/audit-logs', icon: ScrollText, labelKey: 'nav.auditLogs' },
  { path: '/health', icon: HeartPulse, labelKey: 'nav.health' },
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
          collapsed ? 'w-[70px]' : 'w-[220px]',
          collapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        )}
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className="flex items-center h-20 px-4 border-b border-sidebar-border">
          <div className={cn('flex items-center gap-3 overflow-hidden w-full', collapsed && 'justify-center')}>
            <img
              src="/Logo-cockpit.jpeg"
              alt="Cockpit Logo"
              className={cn(
                "object-contain rounded transition-all duration-300",
                collapsed ? "h-8 w-8" : "h-10 w-auto"
              )}
            />
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-lg text-sidebar-foreground truncate tracking-tight">Cockpit</h1>
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider truncate opacity-80">Administration</p>
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
                      'flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      'hover:bg-sidebar-accent hover:text-sidebar-foreground',
                      collapsed ? 'justify-center px-0' : 'px-3',
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

        {/* Settings */}
        <div className="px-3 py-2">
          <NavLink
            to="/settings"
            className={cn(
              'flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              'hover:bg-sidebar-accent hover:text-sidebar-foreground',
              collapsed ? 'justify-center px-0' : 'px-3',
              location.pathname === '/settings'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground'
            )}
            data-testid="nav-settings"
          >
            <Settings className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{t('nav.settings')}</span>}
          </NavLink>
        </div>

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
