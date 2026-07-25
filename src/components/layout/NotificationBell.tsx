import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, MessageSquare, CheckCheck, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/features/auth/AuthContext';
import { bugTrackerApi } from '@/features/bug-tracker/services/bugTrackerApi';
import { demoRequestsApi } from '@/api';
import {
  getNotifSince,
  updateNotifSince,
  getReadCommentIds,
  markCommentIdsAsRead,
} from '@/lib/notifReadState';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [seenVersion, setSeenVersion] = useState(0);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const syncReadIds = useCallback(() => {
    if (user?.id) setReadIds(getReadCommentIds(user.id));
  }, [user?.id]);

  useEffect(() => {
    syncReadIds();
    window.addEventListener('notif-read-updated', syncReadIds);
    return () => window.removeEventListener('notif-read-updated', syncReadIds);
  }, [syncReadIds]);

  const { data: bugComments = [] } = useQuery({
    queryKey: ['bug-comments-recent', user?.id, seenVersion],
    queryFn: () => bugTrackerApi.getRecentComments(getNotifSince(user!.id)),
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.id,
  });

  const { data: demoNotes = [] } = useQuery({
    queryKey: ['demo-notes-recent', user?.id, seenVersion],
    queryFn: () => demoRequestsApi.getRecentNotes(getNotifSince(user!.id)).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.id,
  });

  const otherBugComments = bugComments.filter((c) => c.author?.id !== user?.id);
  const otherDemoNotes = demoNotes.filter((n) => n.author?.id !== user?.id);

  const unreadBugCount = otherBugComments.filter((c) => !readIds.has(c.id)).length;
  const unreadDemoCount = otherDemoNotes.filter((n) => !readIds.has(n.id)).length;
  const unreadCount = unreadBugCount + unreadDemoCount;

  function handleClickBugComment(comment: typeof bugComments[number]) {
    if (user?.id) markCommentIdsAsRead(user.id, [comment.id]);
    navigate(`/bug-tracker/${comment.bug.id}`, { state: { incomingUnreadCount: 1 } });
    setOpen(false);
  }

  function handleClickDemoNote(note: typeof demoNotes[number]) {
    if (user?.id) markCommentIdsAsRead(user.id, [note.id]);
    navigate(`/demo-requests/${note.demoRequest!.id}`);
    setOpen(false);
  }

  function handleMarkAllRead() {
    if (!user?.id) return;
    markCommentIdsAsRead(user.id, [
      ...otherBugComments.map((c) => c.id),
      ...otherDemoNotes.map((n) => n.id),
    ]);
    updateNotifSince(user.id, new Date().toISOString());
    setSeenVersion((v) => v + 1);
    setReadIds(new Set());
    setOpen(false);
  }

  // Merge and sort by date desc
  type NotifItem =
    | { type: 'bug'; id: string; createdAt: string; data: typeof bugComments[number] }
    | { type: 'demo'; id: string; createdAt: string; data: typeof demoNotes[number] };

  const allItems: NotifItem[] = [
    ...otherBugComments.map((c) => ({ type: 'bug' as const, id: c.id, createdAt: c.createdAt, data: c })),
    ...otherDemoNotes.map((n) => ({ type: 'demo' as const, id: n.id, createdAt: n.createdAt, data: n })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 animate-in zoom-in-50">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg" sideOffset={8}>
        {/* Header */}
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold leading-tight">Notifications</p>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} non lu${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1" onClick={handleMarkAllRead}>
              <CheckCheck className="h-3.5 w-3.5" />
              Tout lire
            </Button>
          )}
        </div>
        <Separator />

        {/* Liste */}
        <div className="max-h-80 overflow-y-auto">
          {allItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Aucune activité récente</p>
            </div>
          ) : (
            allItems.map((item) => {
              const isUnread = !readIds.has(item.id);

              if (item.type === 'bug') {
                const comment = item.data;
                return (
                  <button
                    key={item.id}
                    className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 flex items-start gap-2"
                    onClick={() => handleClickBugComment(comment)}
                  >
                    <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${isUnread ? 'bg-primary' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-primary truncate flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 shrink-0" />
                        {comment.bug.bugId} — {comment.bug.title}
                        {comment.mentionedUserIds?.includes(user?.id || '') && (
                          <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0 rounded-full text-[9px] uppercase tracking-wider ml-1">
                            Mention
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-foreground/80 mt-0.5 line-clamp-2 leading-relaxed">{comment.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {comment.author
                          ? `${comment.author.firstName ?? ''} ${comment.author.lastName ?? ''}`.trim() || '—'
                          : '—'}
                        {' · '}
                        {format(new Date(item.createdAt), 'dd/MM HH:mm')}
                      </p>
                    </div>
                  </button>
                );
              }

              // demo note
              const note = item.data;
              return (
                <button
                  key={item.id}
                  className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 flex items-start gap-2"
                  onClick={() => handleClickDemoNote(note)}
                >
                  <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${isUnread ? 'bg-primary' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 truncate flex items-center gap-1">
                      <CalendarCheck className="h-3 w-3 shrink-0" />
                      {note.demoRequest?.company} — Demande de démo
                    </p>
                    <p className="text-xs text-foreground/80 mt-0.5 line-clamp-2 leading-relaxed">{note.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {note.author
                        ? `${note.author.firstName ?? ''} ${note.author.lastName ?? ''}`.trim() || '—'
                        : '—'}
                      {' · '}
                      {format(new Date(item.createdAt), 'dd/MM HH:mm')}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
