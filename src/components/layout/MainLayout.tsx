import { useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from '@/components/ui/toaster';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { KeyboardShortcutsHelp } from '@/components/shared/KeyboardShortcutsHelp';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((c) => !c), []);

  useKeyboardShortcuts({
    onSearch: () => setSearchOpen(true),
    onToggleSidebar: toggleSidebar,
    onHelp: () => setHelpOpen(true),
  });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[70px]' : 'lg:pl-[220px]'}`}>
        <Header
          onMenuToggle={toggleSidebar}
          onSearchOpen={() => setSearchOpen(true)}
        />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
      <Toaster />

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <KeyboardShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
