import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { bugTrackerApi } from '@/features/bug-tracker/services/bugTrackerApi';
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
  ListChecks,
  Bug,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navCategories = [
  {
    titleKey: 'nav.category.general',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    ]
  },
  {
    titleKey: 'nav.category.organization',
    items: [
      { path: '/organizations', icon: Building2, labelKey: 'nav.organizations' },
      { path: '/users', icon: Users, labelKey: 'nav.users' },
      { path: '/invitations', icon: Calendar, labelKey: 'nav.invitations' },
      { path: '/roles', icon: Shield, labelKey: 'nav.roles' },
    ]
  },
  {
    titleKey: 'nav.category.billing',
    items: [
      { path: '/subscription-plans', icon: CreditCard, labelKey: 'nav.subscriptionPlans' },
      { path: '/client-plans', icon: CreditCard, labelKey: 'nav.clientPlans' },
      { path: '/billing-subscriptions', icon: CreditCard, labelKey: 'nav.billingSubscriptions' },
    ]
  },
  {
    titleKey: 'nav.category.bi',
    items: [
      { path: '/dashboards', icon: LayoutDashboard, labelKey: 'nav.clientDashboards' },
      { path: '/kpi-store', icon: BarChart3, labelKey: 'nav.kpiStore' },
      { path: '/nlq-store', icon: Brain, labelKey: 'nav.nlqStore' },
    ]
  },
  {
    titleKey: 'nav.category.operations',
    items: [
      { path: '/onboarding', icon: ListChecks, labelKey: 'nav.onboarding' },
      { path: '/bug-tracker', icon: Bug, labelKey: 'bugTracker.title' },
    ]
  },
  {
    titleKey: 'nav.category.system',
    items: [
      { path: '/agents', icon: Cpu, labelKey: 'nav.agents' },
      { path: '/audit-logs', icon: ScrollText, labelKey: 'nav.auditLogs' },
      { path: '/health', icon: HeartPulse, labelKey: 'nav.health' },
    ]
  },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();

  const { data: stats } = useQuery({
    queryKey: ['bugs-stats'],
    queryFn: () => bugTrackerApi.getStats(),
    refetchInterval: 30000, // Refresh every 30s
  });

  const unresolvedCount = React.useMemo(() => {
    if (!stats?.byStatus) return 0;
    const { nouveau = 0, en_analyse = 0, en_cours = 0, en_test = 0 } = stats.byStatus;
    return nouveau + en_analyse + en_cours + en_test;
  }, [stats]);

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
        <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
          <div className="space-y-6">
            {navCategories.map((category, idx) => (
              <div key={idx} className="space-y-1">
                {!collapsed && (
                  <h3 className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 opacity-50">
                    {t(category.titleKey)}
                  </h3>
                )}
                <ul className="space-y-1">
                  {category.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    const isBugTracker = item.path === '/bug-tracker';
                    const showBadge = isBugTracker && unresolvedCount > 0;

                    return (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          className={cn(
                            'flex items-center gap-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                            'hover:bg-sidebar-accent hover:text-sidebar-foreground',
                            collapsed ? 'justify-center px-0' : 'px-3',
                            isActive
                              ? 'bg-primary/10 text-primary shadow-sm'
                              : 'text-muted-foreground'
                          )}
                          data-testid={`nav-${item.path.slice(1)}`}
                        >
                          <Icon className={cn(
                            "h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                            isActive && "text-primary"
                          )} />
                          {!collapsed && (
                            <span className="flex-1 truncate">{t(item.labelKey)}</span>
                          )}
                          
                          {/* Badge */}
                          {showBadge && (
                            <span className={cn(
                              "flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 animate-in zoom-in-50",
                              collapsed ? "absolute top-1 right-2 scale-75" : "ml-auto"
                            )}>
                              {unresolvedCount > 99 ? '99+' : unresolvedCount}
                            </span>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <Separator className="bg-sidebar-border opacity-50" />

        {/* Settings */}
        <div className="px-3 py-2">
          <NavLink
            to="/settings"
            className={cn(
              'flex items-center gap-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group',
              'hover:bg-sidebar-accent hover:text-sidebar-foreground',
              collapsed ? 'justify-center px-0' : 'px-3',
              location.pathname === '/settings'
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-muted-foreground'
            )}
            data-testid="nav-settings"
          >
            <Settings className={cn(
              "h-5 w-5 shrink-0 transition-transform duration-200 group-hover:rotate-45",
              location.pathname === '/settings' && "text-primary"
            )} />
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
