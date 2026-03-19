import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  Shield,
  CreditCard,
  BarChart3,
  Brain,
  Cpu,
  ScrollText,
  HeartPulse,
  Settings,
  User as UserIcon,
} from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { useOrganizations } from '@/hooks/use-api';
import { useAdminUsers } from '@/hooks/use-api';
import { useAgents } from '@/hooks/use-api';

const NAV_ITEMS = [
  { label: 'Tableau de bord',      path: '/dashboard',              icon: LayoutDashboard },
  { label: 'Organisations',        path: '/organizations',          icon: Building2 },
  { label: 'Utilisateurs',         path: '/users',                  icon: Users },
  { label: 'Invitations',          path: '/invitations',            icon: Calendar },
  { label: 'Rôles',                path: '/roles',                  icon: Shield },
  { label: "Plans d'abonnement",   path: '/subscription-plans',     icon: CreditCard },
  { label: 'Plans Clients',        path: '/client-plans',           icon: CreditCard },
  { label: 'Facturation',          path: '/billing-subscriptions',  icon: CreditCard },
  { label: 'Dashboards Clients',   path: '/dashboards',             icon: LayoutDashboard },
  { label: 'KPI Store',            path: '/kpi-store',              icon: BarChart3 },
  { label: 'NLQ Store',            path: '/nlq-store',              icon: Brain },
  { label: 'Agents',               path: '/agents',                 icon: Cpu },
  { label: "Logs d'audit",         path: '/audit-logs',             icon: ScrollText },
  { label: 'Santé Système',        path: '/health',                 icon: HeartPulse },
  { label: 'Paramètres',           path: '/settings',               icon: Settings },
];

const STATUS_COLORS: Record<string, string> = {
  online:  'bg-green-500',
  offline: 'bg-gray-400',
  error:   'bg-red-500',
  pending: 'bg-yellow-500',
};

const MAX_RESULTS = 5;

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: orgs } = useOrganizations();
  const { data: users } = useAdminUsers();
  const { data: agents } = useAgents();

  const go = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher une page, organisation, utilisateur..." />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
            <CommandItem key={path} value={label} onSelect={() => go(path)}>
              <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Organisations */}
        {orgs && orgs.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Organisations">
              {orgs.slice(0, MAX_RESULTS).map((org) => (
                <CommandItem
                  key={org.id}
                  value={`org-${org.name}`}
                  onSelect={() => go(`/organizations/${org.id}`)}
                >
                  <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{org.name}</span>
                  {org.sector && (
                    <span className="ml-2 text-xs text-muted-foreground">{org.sector}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Utilisateurs */}
        {users && users.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Utilisateurs">
              {users.slice(0, MAX_RESULTS).map((user) => (
                <CommandItem
                  key={user.id}
                  value={`user-${user.firstName} ${user.lastName} ${user.email}`}
                  onSelect={() => go(`/users/${user.id}`)}
                >
                  <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{user.firstName} {user.lastName}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{user.email}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Agents */}
        {agents && agents.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Agents">
              {agents.slice(0, MAX_RESULTS).map((agent) => (
                <CommandItem
                  key={agent.id}
                  value={`agent-${agent.name}`}
                  onSelect={() => go(`/agents/${agent.id}`)}
                >
                  <Cpu className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{agent.name}</span>
                  <span className={`ml-2 inline-block h-2 w-2 rounded-full ${STATUS_COLORS[agent.status] ?? 'bg-gray-400'}`} />
                  <span className="ml-1 text-xs text-muted-foreground capitalize">{agent.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
