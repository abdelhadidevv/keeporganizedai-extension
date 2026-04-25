import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, AlertCircle } from 'lucide-react';
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '@/components/ui';
import { backupService, BackupMetadata } from '@/services/backup';
import { toast } from 'sonner';

export function BackupSection() {
  const [lastBackup, setLastBackup] = useState<BackupMetadata | null>(null);
  const [hasBackup, setHasBackup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const loadBackupInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const backups = await backupService.getBackupMetadata();
      if (backups.length > 0) {
        const latest = backups[0];
        setLastBackup(latest);
        setHasBackup(true);
      } else {
        setHasBackup(false);
      }
    } catch (error) {
      console.error('Failed to load backup info:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBackupInfo();
  }, [loadBackupInfo]);

  const handleRestore = async () => {
    if (!lastBackup) return;

    setIsRestoring(true);
    try {
      await backupService.restoreFromBackup(lastBackup.id);
      toast.success('Bookmarks restored successfully');
      setShowRestoreModal(false);
    } catch (error) {
      console.error('Failed to restore backup:', error);
      toast.error('Failed to restore backup. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderBackupStatus = () => {
    if (isLoading) {
      return <span className="text-xs text-muted">Loading...</span>;
    }
    if (hasBackup) {
      const formattedDate = formatDate(lastBackup!.createdAt);
      // eslint-disable-next-line react/jsx-one-expression-per-line
      return <span className="text-xs text-muted">Last: {formattedDate}</span>;
    }
    return <span className="text-xs text-muted">No backups</span>;
  };

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted uppercase tracking-wider">Data</h2>
      <div className="rounded-lg border border-muted/20 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Restore from Backup</span>
          {renderBackupStatus()}
        </div>

        {hasBackup ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRestoreModal(true)}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Restore
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted">
            <AlertCircle className="w-4 h-4" />
            <span>No backup available. Create a backup before organizing.</span>
          </div>
        )}
      </div>

      <Modal open={showRestoreModal} onOpenChange={setShowRestoreModal}>
        <ModalContent className="max-w-[420px]">
          <ModalHeader>
            <ModalTitle>Restore from Backup</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-muted">
              This will replace all your current bookmarks with the backup from{' '}
              <strong>{lastBackup ? formatDate(lastBackup.createdAt) : 'N/A'}</strong>. This action
              cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowRestoreModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRestore} loading={isRestoring}>
              Restore
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </section>
  );
}
