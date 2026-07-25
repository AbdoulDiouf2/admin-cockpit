import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Mail,
  Calendar,
  MessageSquare,
  ChevronDown,
  Check,
  Loader2,
  Phone,
  Video,
  BadgeCheck,
  XCircle,
  ExternalLink,
  Send,
  ArrowRight,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/features/auth/AuthContext';
import { markCommentIdsAsRead } from '@/lib/notifReadState';
import { DatePicker } from '@/components/shared/DatePicker';
import { DateTimePicker } from '@/components/shared/DateTimePicker';
import {
  demoRequestsApi,
  DemoRequestStatus,
  DemoRequestStatusMeta,
} from '@/api';

const STATUS_BADGE: Record<DemoRequestStatus, { labelKey: string; className: string }> = {
  NEW: { labelKey: 'demoRequests.status.NEW', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  CONTACTED: { labelKey: 'demoRequests.status.CONTACTED', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  DEMO_SCHEDULED: { labelKey: 'demoRequests.status.DEMO_SCHEDULED', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  CONVERTED: { labelKey: 'demoRequests.status.CONVERTED', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  REJECTED: { labelKey: 'demoRequests.status.REJECTED', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

const ALL_STATUSES: DemoRequestStatus[] = ['NEW', 'CONTACTED', 'DEMO_SCHEDULED', 'CONVERTED', 'REJECTED'];

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-orange-500', 'bg-rose-500', 'bg-cyan-500',
];

function getAvatarColor(authorId: string) {
  return AVATAR_COLORS[(authorId?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}

function getInitials(firstName?: string | null, lastName?: string | null, email?: string) {
  const f = (firstName?.[0] ?? '').toUpperCase();
  const l = (lastName?.[0] ?? '').toUpperCase();
  return (f + l) || (email?.[0]?.toUpperCase() ?? '?');
}

function getFullName(firstName?: string | null, lastName?: string | null, email?: string) {
  const name = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  return name || email || '?';
}

export function DemoRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuth();
  const dateLocale = i18n.language === 'fr' ? fr : undefined;

  const commentsEndRef = useRef<HTMLDivElement>(null);

  const { data: request, isLoading, error } = useQuery({
    queryKey: ['demo-request', id],
    queryFn: async () => {
      const resp = await demoRequestsApi.getById(id!);
      return resp.data;
    },
    enabled: !!id,
  });

  const [meta, setMeta] = useState<DemoRequestStatusMeta>({});
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (request) {
      setMeta(request.statusMeta ?? {});
    }
  }, [request]);

  // Auto-scroll to bottom when notes load
  useEffect(() => {
    if (request?.teamNotes?.length) {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [request?.teamNotes?.length]);

  // Mark all team notes as read when page opens
  useEffect(() => {
    if (request?.teamNotes?.length && currentUser?.id) {
      markCommentIdsAsRead(currentUser.id, request.teamNotes.map((n) => n.id));
    }
  }, [request?.teamNotes, currentUser?.id]);

  const updateMutation = useMutation({
    mutationFn: (data: { status?: DemoRequestStatus; statusMeta?: DemoRequestStatusMeta }) =>
      demoRequestsApi.update(id!, data),
    onSuccess: (resp, variables) => {
      if (variables.status) {
        queryClient.invalidateQueries({ queryKey: ['demo-request', id] });
      } else {
        queryClient.setQueryData(['demo-request', id], (old: any) => ({ ...old, ...resp.data }));
      }
      queryClient.invalidateQueries({ queryKey: ['demo-requests'] });
      queryClient.invalidateQueries({ queryKey: ['demo-requests-stats'] });
      toast({ title: t('common.success'), description: t('demoRequests.updateSuccess') });
    },
    onError: (err: any) => {
      toast({ title: t('common.error'), description: err.response?.data?.message || t('demoRequests.updateError'), variant: 'destructive' });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => demoRequestsApi.addNote(id!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demo-request', id] });
      queryClient.invalidateQueries({ queryKey: ['demo-notes-recent'] });
      setNoteText('');
    },
    onError: (err: any) => {
      toast({ title: t('common.error'), description: err.response?.data?.message || t('demoRequests.updateError'), variant: 'destructive' });
    },
  });

  function changeStatus(status: DemoRequestStatus) {
    updateMutation.mutate({ status });
  }

  function saveMeta() {
    updateMutation.mutate({ statusMeta: meta });
  }

  function setMetaField(field: keyof DemoRequestStatusMeta, value: string) {
    setMeta((prev) => ({ ...prev, [field]: value || undefined }));
  }

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="h-[400px] flex items-center justify-center text-destructive">
        {t('demoRequests.detail.notFound')}
      </div>
    );
  }

  const status = request.status;
  const badge = STATUS_BADGE[status];
  const isStatusPending = updateMutation.isPending && updateMutation.variables != null && 'status' in updateMutation.variables;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate('/demo-requests')}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        {t('demoRequests.title')}
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Colonne gauche : infos + champs statut ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Header */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold">{request.company}</h1>
                  <a href={`mailto:${request.email}`} className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
                    <Mail className="h-3.5 w-3.5" />
                    {request.email}
                  </a>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      disabled={isStatusPending}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium cursor-pointer hover:opacity-75 transition-opacity disabled:opacity-50 ${badge.className}`}
                    >
                      {isStatusPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {t(badge.labelKey)}
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {ALL_STATUSES.map((s) => {
                      const b = STATUS_BADGE[s];
                      return (
                        <DropdownMenuItem key={s} onClick={() => { if (s !== status) changeStatus(s); }} className="flex items-center gap-2 cursor-pointer">
                          <span className="w-3.5 shrink-0">{s === status && <Check className="h-3.5 w-3.5" />}</span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${b.className}`}>{t(b.labelKey)}</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>
                  {t('demoRequests.detail.submittedOn', {
                    date: format(new Date(request.createdAt), "d MMMM yyyy 'à' HH:mm", { locale: dateLocale }),
                  })}
                </span>
              </div>
              {request.message && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-foreground leading-relaxed">{request.message}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CONTACTED */}
          {status === 'CONTACTED' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t('demoRequests.detail.contact.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t('demoRequests.detail.contact.date')}</Label>
                    <DatePicker value={meta.contactedAt} onChange={(v) => setMetaField('contactedAt', v)} disabled={(d) => d > new Date()} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('demoRequests.detail.contact.channel')}</Label>
                    <Select value={meta.contactChannel ?? ''} onValueChange={(v) => setMetaField('contactChannel', v)}>
                      <SelectTrigger><SelectValue placeholder={t('demoRequests.detail.contact.channelPlaceholder')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">{t('demoRequests.detail.contact.email')}</SelectItem>
                        <SelectItem value="phone">{t('demoRequests.detail.contact.phone')}</SelectItem>
                        <SelectItem value="visio">{t('demoRequests.detail.contact.visio')}</SelectItem>
                        <SelectItem value="linkedin">{t('demoRequests.detail.contact.linkedin')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveMeta} disabled={updateMutation.isPending} size="sm">
                    {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t('common.save')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* DEMO_SCHEDULED */}
          {status === 'DEMO_SCHEDULED' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  {t('demoRequests.detail.demo.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t('demoRequests.detail.demo.dateTime')}</Label>
                    <DateTimePicker value={meta.demoAt} onChange={(v) => setMetaField('demoAt', v)} disabled={(d) => { const today = new Date(); today.setHours(0,0,0,0); return d < today; }} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('demoRequests.detail.demo.link')}</Label>
                    <Input type="url" placeholder={t('demoRequests.detail.demo.linkPlaceholder')} value={meta.demoLink ?? ''} onChange={(e) => setMetaField('demoLink', e.target.value)} />
                  </div>
                </div>
                {meta.demoLink && (
                  <a href={meta.demoLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {meta.demoLink}
                  </a>
                )}
                <div className="flex justify-end">
                  <Button onClick={saveMeta} disabled={updateMutation.isPending} size="sm">
                    {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t('common.save')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CONVERTED */}
          {status === 'CONVERTED' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-green-500" />
                  {t('demoRequests.detail.converted.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t('demoRequests.detail.converted.date')}</Label>
                    <DatePicker value={meta.convertedAt} onChange={(v) => setMetaField('convertedAt', v)} disabled={(d) => d > new Date()} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('demoRequests.detail.converted.plan')}</Label>
                    <Input placeholder={t('demoRequests.detail.converted.planPlaceholder')} value={meta.planName ?? ''} onChange={(e) => setMetaField('planName', e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveMeta} disabled={updateMutation.isPending} size="sm">
                    {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t('common.save')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* REJECTED */}
          {status === 'REJECTED' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  {t('demoRequests.detail.rejected.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t('demoRequests.detail.rejected.reason')}</Label>
                  <Select value={meta.rejectionReason ?? ''} onValueChange={(v) => setMetaField('rejectionReason', v)}>
                    <SelectTrigger><SelectValue placeholder={t('demoRequests.detail.rejected.reasonPlaceholder')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">{t('demoRequests.detail.rejected.budget')}</SelectItem>
                      <SelectItem value="timing">{t('demoRequests.detail.rejected.timing')}</SelectItem>
                      <SelectItem value="different_need">{t('demoRequests.detail.rejected.differentNeed')}</SelectItem>
                      <SelectItem value="competitor">{t('demoRequests.detail.rejected.competitor')}</SelectItem>
                      <SelectItem value="other">{t('demoRequests.detail.rejected.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('demoRequests.detail.rejected.note')}</Label>
                  <Textarea rows={3} placeholder={t('demoRequests.detail.rejected.notePlaceholder')} value={meta.rejectionNote ?? ''} onChange={(e) => setMetaField('rejectionNote', e.target.value)} />
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveMeta} disabled={updateMutation.isPending} size="sm">
                    {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t('common.save')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historique des changements de statut */}
          {(request.statusEvents?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  {t('demoRequests.detail.statusHistory')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {request.statusEvents!.map((ev) => {
                  const fromBadge = STATUS_BADGE[ev.fromStatus];
                  const toBadge = STATUS_BADGE[ev.toStatus];
                  const fullName = getFullName(ev.author.firstName, ev.author.lastName, ev.author.email);
                  const initials = getInitials(ev.author.firstName, ev.author.lastName, ev.author.email);
                  const color = getAvatarColor(ev.author.id);
                  return (
                    <div key={ev.id} className="flex gap-2 items-center text-xs text-muted-foreground flex-wrap">
                      <div className={`h-6 w-6 rounded-full ${color} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                        {initials}
                      </div>
                      <span className="font-medium text-foreground">{fullName}</span>
                      <span>{t('demoRequests.detail.statusChanged')}</span>
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium ${fromBadge.className}`}>
                        {t(fromBadge.labelKey)}
                      </span>
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium ${toBadge.className}`}>
                        {t(toBadge.labelKey)}
                      </span>
                      <span className="ml-auto shrink-0 text-[10px]">
                        {format(new Date(ev.createdAt), "dd/MM/yyyy 'à' HH:mm", { locale: dateLocale })}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Colonne droite : notes internes ── */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t('demoRequests.detail.notes.title')} ({request.teamNotes?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 px-4">
              <ScrollArea className="h-[400px] mb-4 pr-3">
                {request.teamNotes?.length ? (
                  <div className="space-y-4">
                    {request.teamNotes.map((note) => {
                      const { author } = note;
                      const fullName = getFullName(author.firstName, author.lastName, author.email);
                      const initials = getInitials(author.firstName, author.lastName, author.email);
                      const color = getAvatarColor(author.id);
                      return (
                        <div key={note.id} className="flex gap-2.5 items-start">
                          <div className={`h-7 w-7 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5`}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-xs font-semibold leading-none">{fullName}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(note.createdAt), 'dd/MM HH:mm')}
                              </span>
                            </div>
                            <div className="rounded-2xl rounded-tl-sm px-3 py-2 text-xs whitespace-pre-wrap bg-muted text-foreground">
                              {note.content}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={commentsEndRef} />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-muted-foreground py-6 text-center">{t('demoRequests.detail.notes.empty')}</p>
                  </div>
                )}
              </ScrollArea>

              <Separator className="my-3" />

              <div className="space-y-2 pt-1 pb-1">
                <Textarea
                  placeholder={t('demoRequests.detail.notes.placeholder')}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => addNoteMutation.mutate(noteText.trim())}
                    disabled={!noteText.trim() || addNoteMutation.isPending}
                  >
                    {addNoteMutation.isPending
                      ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      : <Send className="h-3.5 w-3.5 mr-1.5" />
                    }
                    {t('demoRequests.detail.notes.send')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
