import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Clock,
  Monitor,
  Terminal,
  Bug as BugIcon,
  FileText,
  Building2,
  User as UserIcon,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { bugTrackerApi } from './services/bugTrackerApi';
import { useAuth } from '@/features/auth/AuthContext';
import { BugPriority, BugStatus } from './types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useState, useEffect } from 'react';
import { markCommentIdsAsRead } from '@/lib/notifReadState';

export function BugDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const { data: bug, isLoading, error } = useQuery({
    queryKey: ['bug', id],
    queryFn: () => bugTrackerApi.getBugById(id!),
    enabled: !!id,
  });

  // Marquer les commentaires de ce bug comme lus dans le centre de notifs
  useEffect(() => {
    if (bug?.comments?.length && currentUser?.id) {
      markCommentIdsAsRead(currentUser.id, bug.comments.map((c) => c.id));
    }
  }, [bug?.comments, currentUser?.id]);

  const statusMutation = useMutation({
    mutationFn: (status: BugStatus) => bugTrackerApi.updateBugStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug', id] });
      toast({ title: t('common.success'), description: t('bugTracker.statusUpdated') || 'Statut mis à jour' });
    },
  });

  const commentMutation = useMutation({
    mutationFn: () => bugTrackerApi.addComment(id!, commentText, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug', id] });
      setCommentText('');
      toast({ title: 'Commentaire ajouté' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: "Impossible d'ajouter le commentaire.", variant: 'destructive' });
    },
  });

  const assignMutation = useMutation({
    mutationFn: () => bugTrackerApi.assignBug(id!, currentUser!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug', id] });
      toast({
        title: "Bug assigné",
        description: "Le bug vous a été assigné avec succès.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Erreur",
        description: err.response?.data?.message || "Impossible d'assigner le bug.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (error || !bug) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/bug-tracker')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('bugTracker.backToList') || 'Retour à la liste'}
        </Button>
        <div className="flex h-64 items-center justify-center text-destructive">
          Bug introuvable
        </div>
      </div>
    );
  }

  const priorityVariants: Record<BugPriority, string> = {
    critique: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50',
    haute: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/50',
    moyenne: 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900/50',
    basse: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50',
    a_analyser: 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700',
  };

  const statusVariants: Record<BugStatus, string> = {
    nouveau: 'bg-blue-500',
    en_analyse: 'bg-purple-500',
    en_cours: 'bg-yellow-500',
    en_test: 'bg-orange-500',
    resolu: 'bg-green-500',
    ferme: 'bg-slate-500',
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="-ml-2 w-fit"
            onClick={() => navigate('/bug-tracker')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('bugTracker.backToList') || 'Retour à la liste'}
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{bug.bugId}</h1>
            <Badge className={`${priorityVariants[bug.priority]} uppercase text-[10px]`}>
              {t(`bugTracker.priority${bug.priority.charAt(0).toUpperCase() + bug.priority.slice(1).replace('_', '')}`)}
            </Badge>
            <Badge className={`${statusVariants[bug.status]} text-white border-none uppercase text-[10px]`}>
              {t(`bugTracker.status${bug.status.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}`)}
            </Badge>
          </div>
          <p className="text-xl text-muted-foreground">{bug.title}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground">{t('bugTracker.changeStatus')}</span>
            <Select 
              value={bug.status} 
              onValueChange={(value) => statusMutation.mutate(value as BugStatus)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nouveau">{t('bugTracker.statusNouveau')}</SelectItem>
                <SelectItem value="en_analyse">{t('bugTracker.statusEnAnalyse')}</SelectItem>
                <SelectItem value="en_cours">{t('bugTracker.statusEnCours')}</SelectItem>
                <SelectItem value="en_test">{t('bugTracker.statusEnTest')}</SelectItem>
                <SelectItem value="resolu">{t('bugTracker.statusResolu')}</SelectItem>
                <SelectItem value="ferme">{t('bugTracker.statusFerme')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
            <Button 
              variant="outline" 
              className="mt-5"
              onClick={() => assignMutation.mutate()}
              disabled={assignMutation.isPending || bug.assignedToId === currentUser?.id}
            >
              <UserIcon className="h-4 w-4 mr-2" />
              {bug.assignedToId === currentUser?.id ? 'Assigné à vous' : t('bugTracker.assignToMe')}
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Block */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                {t('bugTracker.sectionDescription')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">{t('bugTracker.columnTitle')}</h4>
                <p className="p-4 bg-muted/50 rounded-lg">{bug.description}</p>
              </div>
              
              {bug.steps_to_reproduce?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Étapes pour reproduire</h4>
                  <ol className="list-decimal list-inside space-y-1 p-4 bg-muted/30 rounded-lg">
                    {bug.steps_to_reproduce.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Comportement attendu</h4>
                  <p className="text-sm text-muted-foreground">{bug.expected_behavior || '—'}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Comportement observé</h4>
                  <p className="text-sm text-muted-foreground">{bug.actual_behavior || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environment Block */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="h-5 w-5 text-primary" />
                {t('bugTracker.sectionEnvironment')}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase">OS</p>
                <p className="font-medium">{bug.os}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Navigateur</p>
                <p className="font-medium">{bug.browser}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Résolution</p>
                <p className="font-medium">{bug.screen}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">URL</p>
                <p className="font-medium truncate">{bug.url}</p>
              </div>
            </CardContent>
          </Card>

          {/* Console Errors */}
          {bug.console_errors && (
            <Card className="border-red-200 dark:border-red-900/50">
              <CardHeader className="bg-red-50/50 dark:bg-red-950/20">
                <CardTitle className="flex items-center gap-2 text-lg text-red-700 dark:text-red-400">
                  <Terminal className="h-5 w-5" />
                  Console Errors
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <pre className="p-4 overflow-x-auto text-xs font-mono bg-slate-950 text-red-400">
                  {bug.console_errors}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {bug.attachments?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pièces jointes ({bug.attachments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {bug.attachments.map((url, i) => (
                    <div
                      key={i}
                      className="aspect-video bg-muted rounded-lg border flex items-center justify-center overflow-hidden group relative cursor-pointer"
                      onClick={() => setPreviewImage(url)}
                    >
                      <img
                        src={url}
                        alt={`Capture ${i+1}`}
                        className="object-cover w-full h-full transition-transform hover:scale-105"
                        crossOrigin="anonymous"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="sm">Agrandir</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
                Commentaires ({bug.comments?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 px-4">
              {bug.comments?.length ? (
                <div className="space-y-4 mb-4">
                  {bug.comments.map(comment => {
                    const fullName = comment.author
                      ? `${comment.author.firstName ?? ''} ${comment.author.lastName ?? ''}`.trim() || comment.author.email
                      : '?';
                    const initials = comment.author
                      ? `${(comment.author.firstName ?? '')[0] ?? ''}${(comment.author.lastName ?? '')[0] ?? ''}`.toUpperCase() || comment.author.email[0].toUpperCase()
                      : '?';
                    const avatarColors = [
                      'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
                      'bg-orange-500', 'bg-rose-500', 'bg-cyan-500',
                    ];
                    const colorIndex = (comment.authorId?.charCodeAt(0) ?? 0) % avatarColors.length;
                    return (
                      <div key={comment.id} className="flex gap-3 items-start">
                        <div className={`h-8 w-8 rounded-full ${avatarColors[colorIndex]} flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5`}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold leading-none">{fullName}</span>
                                    <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm')}
                            </span>
                          </div>
                          <div className="rounded-2xl rounded-tl-sm px-3 py-2 text-sm whitespace-pre-wrap bg-muted text-foreground">
                            {comment.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Aucun commentaire pour l'instant</p>
              )}

              <Separator className="my-4" />
              <div className="space-y-3 pt-1 pb-1">
                <Textarea
                  placeholder="Écrire un commentaire..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => commentMutation.mutate()}
                    disabled={!commentText.trim() || commentMutation.isPending}
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    Envoyer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Context */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Context Métier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Client / Entité</p>
                <div className="flex flex-col">
                  <p className="font-bold">{bug.organization?.name || '—'}</p>
                  {bug.entity_code && <p className="text-xs text-muted-foreground">{bug.entity_code}</p>}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Exercice Comptable</p>
                <p className="font-bold">{bug.fiscal_year}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">{t('bugTracker.columnImpact')}</p>
                <Badge variant="secondary" className="mt-1">
                  {t(`bugImpact.${bug.impact}`) || bug.impact.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('bugTracker.columnFrequency')}</p>
                <p className="font-medium">{t(`bugFrequency.${bug.frequency}`) || bug.frequency}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-8">
              <div className="space-y-0">
              {/* Étape 1 : Création (Toujours présente) */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-500 z-10 shrink-0">
                    <BugIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  {(bug.assignedTo || bug.status !== 'nouveau') && <div className="w-0.5 h-10 bg-blue-200" />}
                </div>
                <div className="pb-6">
                  <p className="text-xs font-bold uppercase text-blue-600">{t('bugTracker.statusNouveau')}</p>
                  <p className="text-xs text-muted-foreground">
                    {bug.createdAt ? format(new Date(bug.createdAt), 'dd/MM/yyyy HH:mm') : '—'}
                  </p>
                  <p className="text-sm mt-1">
                    Soumis par {bug.submittedBy?.firstName || bug.submittedBy?.lastName 
                      ? `${bug.submittedBy.firstName || ''} ${bug.submittedBy.lastName || ''}`.trim()
                      : bug.submittedBy?.email || '—'}
                  </p>
                </div>
              </div>

              {/* Étape 2 : Assignation (Si assigné) */}
              {bug.assignedTo && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center border-2 border-orange-500 z-10 shrink-0">
                      <UserIcon className="h-4 w-4 text-orange-600" />
                    </div>
                    {bug.status !== 'nouveau' && bug.status !== 'en_analyse' && <div className="w-0.5 h-10 bg-orange-200" />}
                  </div>
                  <div className="pb-6">
                    <p className="text-xs font-bold uppercase text-orange-600">Assigné</p>
                    <p className="text-sm mt-1">
                      Assigné à {bug.assignedTo.name || `${(bug.assignedTo as any).firstName || ''} ${(bug.assignedTo as any).lastName || ''}`.trim() || '—'}
                    </p>
                  </div>
                </div>
              )}

              {/* Étape 3 : Statut Actuel (Si différent de Nouveau/Analyse) */}
              {bug.status !== 'nouveau' && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`h-8 w-8 rounded-full ${statusVariants[bug.status]} bg-opacity-20 flex items-center justify-center border-2 ${statusVariants[bug.status].replace('bg-', 'border-')} z-10 shrink-0`}>
                      <div className={`h-2 w-2 rounded-full ${statusVariants[bug.status]}`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase">{t(`bugTracker.status${bug.status.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}`)}</p>
                    <p className="text-xs text-muted-foreground">Dernière mise à jour</p>
                  </div>
                </div>
              )}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {bug.tags?.length > 0 && (
            <Card>
               <CardHeader>
                <CardTitle className="text-lg">Tags</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {bug.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="bg-primary/5">#{tag}</Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent shadow-none overflow-hidden flex items-center justify-center">
          <div className="relative group w-full h-full flex items-center justify-center p-4">
             {previewImage && (
               <img 
                 src={previewImage} 
                 alt="Preview" 
                 className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl bg-background"
                 crossOrigin="anonymous" 
               />
             )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
