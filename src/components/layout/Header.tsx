import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useTheme } from '@/components/shared/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Menu,
  Sun,
  Moon,
  Languages,
  LogOut,
  User as UserIcon,
  ChevronRight,
  House,
  Search,
  Keyboard,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';

// Ordered from most specific to least specific
const PAGE_TITLE_MAP: { pattern: RegExp; key: string; parentPath?: string; subKey?: string }[] = [
  { pattern: /^\/organizations\/[^/]+/, key: 'nav.organizations', parentPath: '/organizations' },
  { pattern: /^\/organizations/, key: 'nav.organizations' },
  { pattern: /^\/users\/[^/]+/, key: 'nav.users', parentPath: '/users' },
  { pattern: /^\/users/, key: 'nav.users' },
  { pattern: /^\/roles\/[^/]+/, key: 'nav.roles', parentPath: '/roles' },
  { pattern: /^\/roles/, key: 'nav.roles' },
  { pattern: /^\/subscription-plans\/[^/]+/, key: 'nav.subscriptionPlans', parentPath: '/subscription-plans' },
  { pattern: /^\/subscription-plans/, key: 'nav.subscriptionPlans' },
  { pattern: /^\/client-plans/, key: 'nav.clientPlans' },
  { pattern: /^\/billing-subscriptions\/[^/]+/, key: 'nav.billingSubscriptions', parentPath: '/billing-subscriptions' },
  { pattern: /^\/billing-subscriptions/, key: 'nav.billingSubscriptions' },
  { pattern: /^\/dashboards\/[^/]+/, key: 'nav.clientDashboards', parentPath: '/dashboards' },
  { pattern: /^\/dashboards/, key: 'nav.clientDashboards' },
  { pattern: /^\/kpi-store\/widget-templates\/[^/]+/, key: 'nav.kpiStore', parentPath: '/kpi-store' },
  { pattern: /^\/kpi-store\/definitions\/[^/]+/, key: 'nav.kpiStore', parentPath: '/kpi-store' },
  { pattern: /^\/kpi-store\/packs\/[^/]+/, key: 'nav.kpiStore', parentPath: '/kpi-store' },
  { pattern: /^\/kpi-store/, key: 'nav.kpiStore' },
  { pattern: /^\/kpi-health\/[^/]+/, key: 'nav.kpiHealth', parentPath: '/kpi-health', subKey: 'kpiHealth.detailBreadcrumb' },
  { pattern: /^\/kpi-health/, key: 'nav.kpiHealth' },
  { pattern: /^\/nlq-store\/intents\/[^/]+/, key: 'nav.nlqStore', parentPath: '/nlq-store' },
  { pattern: /^\/nlq-store\/templates\/[^/]+/, key: 'nav.nlqStore', parentPath: '/nlq-store' },
  { pattern: /^\/nlq-store\/sessions\/[^/]+/, key: 'nav.nlqStore', parentPath: '/nlq-store' },
  { pattern: /^\/nlq-store/, key: 'nav.nlqStore' },
  { pattern: /^\/bug-tracker\/new/, key: 'nav.bugTracker', parentPath: '/bug-tracker', subKey: 'bugTracker.newBug' },
  { pattern: /^\/bug-tracker\/[^/]+/, key: 'nav.bugTracker', parentPath: '/bug-tracker', subKey: 'bugTracker.detailsTitle' },
  { pattern: /^\/bug-tracker/, key: 'nav.bugTracker' },
  { pattern: /^\/agents\/[^/]+/, key: 'nav.agents', parentPath: '/agents' },
  { pattern: /^\/agents/, key: 'nav.agents' },
  { pattern: /^\/audit-logs\/[^/]+/, key: 'nav.auditLogs', parentPath: '/audit-logs' },
  { pattern: /^\/audit-logs/, key: 'nav.auditLogs' },
  { pattern: /^\/invitations/, key: 'nav.invitations' },
  { pattern: /^\/health/, key: 'nav.health' },
  { pattern: /^\/settings/, key: 'nav.settings' },
  { pattern: /^\/profile/, key: 'nav.profile' },
  { pattern: /^\/dashboard/, key: 'nav.dashboard' },
];

function usePageTitle() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const match = PAGE_TITLE_MAP.find(({ pattern }) => pattern.test(pathname));
  if (!match) return { title: '', parentPath: undefined, subTitle: undefined };
  return { 
    title: t(match.key), 
    parentPath: match.parentPath, 
    subTitle: match.subKey ? t(match.subKey) : undefined 
  };
}

interface HeaderProps {
  onMenuToggle: () => void;
  onSearchOpen: () => void;
}

export function Header({ onMenuToggle, onSearchOpen }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { title, parentPath, subTitle } = usePageTitle();

  const currentLang = i18n.language;

  const toggleLanguage = () => {
    const newLang = currentLang === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {/* Mobile menu */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuToggle}
            data-testid="mobile-menu-btn"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumb */}
          <nav className="hidden lg:flex items-center gap-1 text-sm">
            <NavLink
              to="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
            >
              <House className="h-4 w-4" />
            </NavLink>

            {title && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />

                {parentPath ? (
                  <>
                    <NavLink
                      to={parentPath}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {title}
                    </NavLink>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                    <span className="font-semibold text-foreground">{subTitle || 'Détail'}</span>
                  </>
                ) : (
                  <span className="font-semibold text-foreground">{title}</span>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Search button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onSearchOpen}
          className="hidden lg:flex items-center gap-2 text-muted-foreground w-52 justify-between ml-auto"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            <span className="text-xs">Rechercher...</span>
          </div>
          <kbd className="text-[10px] bg-muted border border-border px-1.5 py-0.5 rounded font-mono leading-none">
            Ctrl+K
          </kbd>
        </Button>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 lg:ml-2">
          {/* Keyboard shortcuts hint */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex text-muted-foreground"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))}
            title="Raccourcis clavier (?)"
            data-testid="shortcuts-help-btn"
          >
            <Keyboard className="h-4 w-4" />
          </Button>

          {/* Language toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="relative"
            data-testid="language-toggle"
          >
            <Languages className="h-5 w-5" />
            <span className="absolute -bottom-1 -right-1 text-[10px] font-bold uppercase bg-primary text-primary-foreground rounded px-1">
              {currentLang}
            </span>
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="theme-toggle"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
                data-testid="user-menu-btn"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => navigate('/profile')}
                data-testid="profile-menu-item"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleLogout}
                data-testid="logout-menu-item"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('auth.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
