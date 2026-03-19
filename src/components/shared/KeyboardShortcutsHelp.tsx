import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ShortcutRowProps {
  keys: string[];
  description: string;
}

function ShortcutRow({ keys, description }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <span key={i} className="flex items-center gap-1">
            <kbd className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-mono font-medium text-foreground">
              {k}
            </kbd>
            {i < keys.length - 1 && (
              <span className="text-xs text-muted-foreground">puis</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {title}
      </p>
      <div className="divide-y divide-border/50">{children}</div>
    </div>
  );
}

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Raccourcis clavier</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1 overflow-y-auto pr-1">
          <Section title="Général">
            <ShortcutRow keys={['Ctrl', 'K']}        description="Recherche globale" />
            <ShortcutRow keys={['Ctrl', '\\']}        description="Réduire / étendre le sidebar" />
            <ShortcutRow keys={['Ctrl', 'Shift', 'L']} description="Basculer thème clair / sombre" />
            <ShortcutRow keys={['?']}                description="Afficher cette aide" />
          </Section>

          <Section title="Navigation — G puis...">
            <ShortcutRow keys={['G', 'D']} description="Tableau de bord" />
            <ShortcutRow keys={['G', 'O']} description="Organisations" />
            <ShortcutRow keys={['G', 'U']} description="Utilisateurs" />
            <ShortcutRow keys={['G', 'I']} description="Invitations" />
            <ShortcutRow keys={['G', 'R']} description="Rôles" />
            <ShortcutRow keys={['G', 'P']} description="Plans d'abonnement" />
            <ShortcutRow keys={['G', 'C']} description="Plans Clients" />
            <ShortcutRow keys={['G', 'F']} description="Facturation" />
            <ShortcutRow keys={['G', 'T']} description="Dashboards Clients" />
            <ShortcutRow keys={['G', 'K']} description="KPI Store" />
            <ShortcutRow keys={['G', 'N']} description="NLQ Store" />
            <ShortcutRow keys={['G', 'A']} description="Agents" />
            <ShortcutRow keys={['G', 'L']} description="Logs d'audit" />
            <ShortcutRow keys={['G', 'H']} description="Santé Système" />
            <ShortcutRow keys={['G', 'S']} description="Paramètres" />
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
