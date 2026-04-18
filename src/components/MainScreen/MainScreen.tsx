import { useCallback, useEffect, useRef } from 'react';
import { Settings, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useMainScreen } from '@/hooks/useMainScreen';
import { Search } from '@/components/Search';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Header } from './Header';
import { FolderList } from './FolderList';

interface MainScreenProps {
  onAutoOrganizeClick?: () => void;
  onSettingsClick?: () => void;
}

export function MainScreen({ onAutoOrganizeClick, onSettingsClick }: MainScreenProps) {
  const {
    filteredFolders,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedFolderId,
    setSelectedFolderId,
    expandedFolderIds,
    toggleExpanded,
    lockStates,
    expandAll,
    collapseAll,
    refreshBookmarks,
    hasBookmarks,
  } = useMainScreen();

  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
    },
    [setSearchQuery]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        refreshBookmarks();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refreshBookmarks]);

  useEffect(() => {
    const handleMessage = (message: { type: string }) => {
      console.log('Received message in MainScreen:', message);
      if (message.type === 'FOCUS_SEARCH') {
        searchInputRef.current?.focus();
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     searchInputRef.current?.focus();
  //   }, 100);
  //   return () => clearTimeout(timer);
  // }, []);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header onAutoOrganize={onAutoOrganizeClick} isAutoOrganizeDisabled={!hasBookmarks} />
      <div className="w-full px-4 py-3 border-b border-secondary/20 flex items-center gap-2">
        <Search
          ref={searchInputRef}
          placeholder="Search bookmarks... (/)"
          onChange={handleSearch}
          value={searchQuery}
        />
        <Button variant="ghost" size="icon-sm" onClick={expandAll} title="Expand all">
          <ChevronDown className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={collapseAll} title="Collapse all">
          <ChevronUp className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={refreshBookmarks}
          title="Refresh bookmarks (R)"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      <FolderList
        folders={filteredFolders}
        expandedFolderIds={expandedFolderIds}
        selectedFolderId={selectedFolderId}
        lockStates={lockStates}
        isLoading={isLoading}
        error={error}
        highlightQuery={searchQuery}
        onToggleExpanded={toggleExpanded}
        onSelectFolder={setSelectedFolderId}
        onRefresh={refreshBookmarks}
      />

      <footer
        className={cn(
          'flex items-center justify-between px-4 py-3 select-none',
          'border-t border-[var(--color-secondary)]/20',
          'bg-[var(--color-secondary)]/5'
        )}
      >
        <span className="text-xs text-[var(--color-secondary)]">KeepOrganizedAI v1.0.1</span>
        <Button variant="ghost" size="sm" onClick={onSettingsClick}>
          <Settings className="w-4 h-4 mr-1" />
          Settings
        </Button>
      </footer>
    </div>
  );
}
