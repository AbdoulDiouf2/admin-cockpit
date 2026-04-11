import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileDown,
  Upload,
  MoreHorizontal,
  Star,
  Trash2,
  Copy,
  CheckCircle2,
  Loader2,
  Package,
  Monitor,
  Terminal,
  Laptop,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { agentReleasesApi } from '@/api';
import { AgentRelease } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { UploadReleaseModal } from './UploadReleaseModal';

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  windows: Monitor,
  linux: Terminal,
  macos: Laptop,
};

const PLATFORM_COLORS: Record<string, string> = {
  windows: 'text-blue-500',
  linux: 'text-orange-500',
  macos: 'text-slate-500',
};

const PLATFORM_LABELS: Record<string, string> = {
  windows: 'Windows',
  linux: 'Linux',
  macos: 'macOS',
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function AgentReleasesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteRelease, setDeleteRelease] = useState<AgentRelease | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: releases, isLoading, error } = useQuery({
    queryKey: ['agent-releases'],
    queryFn: () => agentReleasesApi.getAll().then((r) => r.data),
  });

  const setLatestMutation = useMutation({
    mutationFn: (id: string) => agentReleasesApi.setLatest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-releases'] });
      toast({ title: 'Release mise à jour', description: 'La release est maintenant marquée comme dernière version.' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de mettre à jour la release.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => agentReleasesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-releases'] });
      toast({ title: 'Release supprimée', description: 'L\'exécutable a été supprimé.' });
      setDeleteRelease(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de supprimer la release.',
        variant: 'destructive',
      });
    },
  });

  function copyChecksum(release: AgentRelease) {
    if (!release.checksum) return;
    navigator.clipboard.writeText(release.checksum);
    setCopiedId(release.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Grouper par plateforme pour les stats
  const byPlatform = (releases ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.platform] = (acc[r.platform] ?? 0) + 1;
    return acc;
  }, {});

  const latestCount = (releases ?? []).filter((r) => r.isLatest).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileDown className="h-6 w-6 text-primary" />
            Releases Agent
          </h1>
          <p className="text-muted-foreground">
            Gérez les exécutables de l'agent on-premise distribués lors de l'onboarding.
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Publier une release
        </Button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold mt-1">{releases?.length ?? '—'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Actives (latest)</p>
          <p className="text-2xl font-bold mt-1 text-primary">{latestCount}</p>
        </Card>
        {['windows', 'linux'].map((p) => {
          const Icon = PLATFORM_ICONS[p];
          return (
            <Card key={p} className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Icon className={`h-3.5 w-3.5 ${PLATFORM_COLORS[p]}`} />
                {PLATFORM_LABELS[p]}
              </p>
              <p className="text-2xl font-bold mt-1">{byPlatform[p] ?? 0}</p>
            </Card>
          );
        })}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Toutes les releases
          </CardTitle>
          <CardDescription>
            Marquez une release comme "latest" pour qu'elle soit proposée au téléchargement dans l'onboarding.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="h-64 flex items-center justify-center text-destructive">
              Erreur lors du chargement des releases.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fichier</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Plateforme</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Publié le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(releases ?? []).map((release) => (
                    <TableRow key={release.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm truncate max-w-[220px]">{release.fileName}</p>
                          {release.checksum && (
                            <button
                              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                              onClick={() => copyChecksum(release)}
                              title="Copier le checksum SHA256"
                            >
                              {copiedId === release.id ? (
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              <span className="truncate max-w-[160px] font-mono">
                                {release.checksum.replace('sha256:', '').slice(0, 16)}…
                              </span>
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm font-semibold">v{release.version}</span>
                        <span className="ml-1.5 text-xs text-muted-foreground">{release.arch}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {(() => { const Icon = PLATFORM_ICONS[release.platform]; return Icon ? <Icon className={`h-4 w-4 ${PLATFORM_COLORS[release.platform]}`} /> : <Package className="h-4 w-4 text-muted-foreground" />; })()}
                          <span className="text-sm">{PLATFORM_LABELS[release.platform] ?? release.platform}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatBytes(release.fileSize)}
                      </TableCell>
                      <TableCell>
                        {release.isLatest ? (
                          <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            Latest
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Archivée
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(release.uploadedAt), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Ouvrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <a href={release.fileUrl} target="_blank" rel="noopener noreferrer" download>
                                <FileDown className="mr-2 h-4 w-4" />
                                Télécharger
                              </a>
                            </DropdownMenuItem>
                            {release.checksum && (
                              <DropdownMenuItem onClick={() => copyChecksum(release)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copier le checksum
                              </DropdownMenuItem>
                            )}
                            {!release.isLatest && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setLatestMutation.mutate(release.id)}
                                  disabled={setLatestMutation.isPending}
                                >
                                  <Star className="mr-2 h-4 w-4" />
                                  Marquer comme latest
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteRelease(release)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(releases ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        <FileDown className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p>Aucune release publiée.</p>
                        <p className="text-xs mt-1">Cliquez sur "Publier une release" pour commencer.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <UploadReleaseModal open={uploadOpen} onOpenChange={setUploadOpen} />

      <ConfirmDialog
        open={deleteRelease !== null}
        onOpenChange={(open) => { if (!open) setDeleteRelease(null); }}
        title="Supprimer cette release ?"
        description={`L'exécutable "${deleteRelease?.fileName}" sera définitivement supprimé. Cette action est irréversible.`}
        onConfirm={() => deleteRelease && deleteMutation.mutate(deleteRelease.id)}
        isPending={deleteMutation.isPending}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
      />
    </div>
  );
}
