import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/shared/ThemeProvider';

const GOTO_MAP: Record<string, string> = {
  d: '/dashboard',
  o: '/organizations',
  u: '/users',
  i: '/invitations',
  r: '/roles',
  p: '/subscription-plans',
  c: '/client-plans',
  f: '/billing-subscriptions',
  t: '/dashboards',
  k: '/kpi-store',
  n: '/nlq-store',
  a: '/agents',
  l: '/audit-logs',
  h: '/health',
  s: '/settings',
};

interface Options {
  onSearch: () => void;
  onToggleSidebar: () => void;
  onHelp: () => void;
}

export function useKeyboardShortcuts({ onSearch, onToggleSidebar, onHelp }: Options) {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const gPressedRef = useRef(false);
  const gTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // ── Ctrl/Cmd shortcuts (always active) ────────────────────────────────
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'k') {
          e.preventDefault();
          onSearch();
          return;
        }
        if (e.key === '\\') {
          e.preventDefault();
          onToggleSidebar();
          return;
        }
        if (e.shiftKey && e.key === 'L') {
          e.preventDefault();
          toggleTheme();
          return;
        }
        return;
      }

      // ── Shortcuts disabled when focus is in an input ───────────────────────
      if (inInput) return;

      // ? — cheatsheet
      if (e.key === '?') {
        e.preventDefault();
        onHelp();
        return;
      }

      // G + letter — goto navigation
      if (e.key === 'g') {
        gPressedRef.current = true;
        clearTimeout(gTimeoutRef.current);
        gTimeoutRef.current = setTimeout(() => {
          gPressedRef.current = false;
        }, 500);
        return;
      }

      if (gPressedRef.current) {
        gPressedRef.current = false;
        clearTimeout(gTimeoutRef.current);
        const path = GOTO_MAP[e.key];
        if (path) {
          e.preventDefault();
          navigate(path);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      clearTimeout(gTimeoutRef.current);
    };
  }, [navigate, toggleTheme, onSearch, onToggleSidebar, onHelp]);
}
