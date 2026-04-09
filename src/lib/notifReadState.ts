/** Clé localStorage : timestamp depuis lequel on fetch les commentaires */
const sinceKey = (userId: string) => `notif_since_${userId}`;
/** Clé localStorage : IDs de commentaires déjà lus */
const readKey = (userId: string) => `notif_read_${userId}`;

/** Retourne le timestamp depuis lequel fetcher. Epoch 0 pour les nouveaux admins → voient tout. */
export function getNotifSince(userId: string): string {
  return localStorage.getItem(sinceKey(userId)) ?? new Date(0).toISOString();
}

/** Met à jour le timestamp "depuis" et vide optionnellement les IDs lus. */
export function updateNotifSince(userId: string, timestamp: string) {
  localStorage.setItem(sinceKey(userId), timestamp);
  localStorage.removeItem(readKey(userId)); // les anciens IDs ne sont plus pertinents
}

/** Retourne l'ensemble des IDs de commentaires lus. */
export function getReadCommentIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(readKey(userId));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

/** Marque des IDs de commentaires comme lus et émet un event pour synchroniser la cloche. */
export function markCommentIdsAsRead(userId: string, ids: string[]) {
  if (!ids.length) return;
  const existing = getReadCommentIds(userId);
  ids.forEach((id) => existing.add(id));
  localStorage.setItem(readKey(userId), JSON.stringify([...existing]));
  window.dispatchEvent(new CustomEvent('notif-read-updated'));
}
