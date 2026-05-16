import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FolderContextMenuProps {
  x: number;
  y: number;
  folderName: string;
  onShare: () => void;
  onClose: () => void;
}

export function FolderContextMenu({ x, y, folderName, onShare, onClose }: FolderContextMenuProps) {
  const { t } = useTranslation('common');

  const menuItems = [
    {
      icon: <Share2 className="h-4 w-4" />,
      label: t('folder_context_menu.share_with_friend'),
      description: t('folder_context_menu.share_description'),
      actionKey: 'share',
    },
  ] as const;

  const handleAction = React.useCallback(
    (actionKey: string) => {
      switch (actionKey) {
        case 'share':
          onShare();
          break;
        default:
          break;
      }
      onClose();
    },
    [onShare, onClose]
  );

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="fixed inset-0 z-50"
      onContextMenu={(e) => e.preventDefault()}
      onClick={onClose}
      onKeyDown={handleOverlayKeyDown}
    >
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        style={{ left: x, top: y }}
        className="absolute"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleOverlayKeyDown}
      >
        <DropdownMenuPrimitive.Root
          open
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        >
          <DropdownMenuPrimitive.Trigger asChild>
            <div className="w-px h-px" />
          </DropdownMenuPrimitive.Trigger>

          <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
              side="bottom"
              align="start"
              sideOffset={0}
              className={cn(
                'z-50 min-w-[220px] overflow-hidden rounded-lg border',
                'border-muted/20 bg-background shadow-lg',
                'data-[state=open]:animate-in data-[state=closed]:animate-out',
                'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
              )}
            >
              <div className="px-3 py-2 border-b border-muted/10">
                <span className="text-xs font-medium text-muted-foreground truncate block">
                  {folderName}
                </span>
              </div>
              <div className="p-1">
                {menuItems.map((item) => (
                  <DropdownMenuPrimitive.Item
                    key={item.actionKey}
                    onSelect={() => handleAction(item.actionKey)}
                    className={cn(
                      'relative flex cursor-pointer select-none items-center gap-2 rounded-md',
                      'px-2 py-2 text-sm outline-none transition-colors',
                      'focus:bg-muted/10',
                      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                    )}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/10 text-muted-foreground">
                      {item.icon}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </div>
                  </DropdownMenuPrimitive.Item>
                ))}
              </div>
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Root>
      </div>
    </div>
  );
}
