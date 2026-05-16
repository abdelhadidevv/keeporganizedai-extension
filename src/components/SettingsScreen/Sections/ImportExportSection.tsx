import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload, FileText, FolderOpen, AlertCircle, ArrowLeftRight } from 'lucide-react';
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '@/components/ui';
import { backupService, BackupData } from '@/services/backup';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ImportMode = 'merge' | 'replace';

interface ImportPreview {
  data: BackupData;
  bookmarkCount: number;
  folderCount: number;
  fileName: string;
}

export function ImportExportSection() {
  const { t } = useTranslation('common');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportHtml = async () => {
    setIsExporting(true);
    try {
      await backupService.exportAsDownload();
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('settings.import_export.toast_export_failed'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = async () => {
    setIsExporting(true);
    try {
      await backupService.exportToJson();
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('settings.import_export.toast_export_failed'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await backupService.parseFileImport(file);
      const counts = backupService.countNodes(data.bookmarkTree);

      setPreview({
        data,
        bookmarkCount: counts.bookmarks,
        folderCount: counts.folders,
        fileName: file.name,
      });
    } catch (error) {
      console.error('Import parsing failed:', error);
      toast.error(
        error instanceof Error ? error.message : t('settings.import_export.toast_parse_failed')
      );
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportConfirm = async () => {
    if (!preview) return;

    try {
      await backupService.importBookmarks(preview.data, importMode);
      toast.success(
        importMode === 'merge'
          ? t('settings.import_export.toast_import_success_merge')
          : t('settings.import_export.toast_import_success_replace')
      );
      setPreview(null);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(
        error instanceof Error ? error.message : t('settings.import_export.toast_import_failed')
      );
    }
  };

  const handleCancelPreview = () => {
    setPreview(null);
  };

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">
        {t('settings.import_export.heading')}
      </h2>

      <div className="rounded-lg border border-muted/20 bg-card p-4 space-y-4">
        <div className="space-y-3">
          <span className="block text-xs text-muted-foreground">
            {t('settings.import_export.export_bookmarks')}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportHtml}
              loading={isExporting}
              leftIcon={<Download className="w-4 h-4" />}
            >
              {t('settings.import_export.export_html')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              loading={isExporting}
              leftIcon={<Download className="w-4 h-4" />}
            >
              {t('settings.import_export.export_json')}
            </Button>
          </div>
        </div>

        <div className="border-t border-muted/20" />

        <div className="space-y-3">
          <span className="block text-xs text-muted-foreground">
            {t('settings.import_export.import_bookmarks')}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm,.json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            loading={isImporting}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            {t('settings.import_export.choose_file')}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t('settings.import_export.supported_formats')}
          </p>
        </div>
      </div>

      <Modal open={!!preview} onOpenChange={(open) => !open && handleCancelPreview()}>
        <ModalContent className="max-w-[480px]">
          <ModalHeader>
            <ModalTitle>{t('settings.import_export.modal_title')}</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span className="truncate">{preview?.fileName}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/10">
                  <FileText className="w-5 h-5 text-[var(--color-primary)]" />
                  <div>
                    <div className="text-lg font-semibold">{preview?.bookmarkCount ?? 0}</div>
                    <div className="text-xs text-muted-foreground">
                      {t('settings.import_export.bookmarks_label')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/10">
                  <FolderOpen className="w-5 h-5 text-[var(--color-primary)]" />
                  <div>
                    <div className="text-lg font-semibold">{preview?.folderCount ?? 0}</div>
                    <div className="text-xs text-muted-foreground">
                      {t('settings.import_export.folders_label')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-sm font-medium">
                  {t('settings.import_export.import_mode')}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode('merge')}
                    className={cn(
                      'flex-1 px-3 py-2 text-sm rounded-lg border transition-colors',
                      importMode === 'merge'
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'border-muted/30 hover:bg-muted/10'
                    )}
                  >
                    {t('merge')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={cn(
                      'flex-1 px-3 py-2 text-sm rounded-lg border transition-colors',
                      importMode === 'replace'
                        ? 'border-[var(--color-error)] bg-[var(--color-error)]/10 text-[var(--color-error)]'
                        : 'border-muted/30 hover:bg-muted/10'
                    )}
                  >
                    {t('settings.import_export.replace_all')}
                  </button>
                </div>
              </div>

              {importMode === 'replace' && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-error)]/10 text-[var(--color-error)]">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p className="text-xs">{t('settings.import_export.replace_warning')}</p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={handleCancelPreview}>
              {t('cancel')}
            </Button>
            <Button
              variant={importMode === 'replace' ? 'destructive' : 'default'}
              onClick={handleImportConfirm}
              leftIcon={<ArrowLeftRight className="w-4 h-4" />}
            >
              {importMode === 'merge' ? t('merge') : t('replace')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </section>
  );
}
