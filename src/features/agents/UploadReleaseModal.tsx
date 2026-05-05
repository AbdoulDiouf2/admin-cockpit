import { useRef, useState } from 'react';
import { Upload, X, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUploadRelease } from './UploadReleaseContext';

interface UploadReleaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PLATFORM_LABELS: Record<string, string> = {
  windows: 'Windows (.exe)',
  linux: 'Linux (.deb / AppImage)',
  macos: 'macOS (.dmg)',
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function UploadReleaseModal({ open, onOpenChange }: UploadReleaseModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState('');
  const [platform, setPlatform] = useState('windows');
  const [arch, setArch] = useState('x64');
  const [changelog, setChangelog] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const { startUpload, isUploading, progress, error, fileName: uploadingFileName } = useUploadRelease();

  // Upload en cours pour CE fichier (pas un autre upload d'une session précédente)
  const thisUploadActive = isUploading && uploadingFileName === file?.name;

  function resetForm() {
    setFile(null);
    setVersion('');
    setPlatform('windows');
    setArch('x64');
    setChangelog('');
  }

  function handleClose() {
    if (!thisUploadActive) resetForm();
    onOpenChange(false);
  }

  function handleBackground() {
    // Ferme le modal, l'upload continue — le header affiche la progression
    onOpenChange(false);
  }

  function handleFileSelect(selected: File) {
    setFile(selected);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  }

  function handleSubmit() {
    if (!file || !version || !platform) return;
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('version', version.trim());
    formData.append('platform', platform);
    formData.append('arch', arch);
    if (changelog.trim()) formData.append('changelog', changelog.trim());
    startUpload(formData, file.name);
    // Modal reste ouvert pour afficher la progression
  }

  const canSubmit = !!file && !!version.trim() && !!platform && !isUploading;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-primary" />
            Publier une release agent
          </DialogTitle>
          <DialogDescription>
            Uploadez l'exécutable de l'agent on-premise. Il sera disponible au téléchargement depuis l'onboarding.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Zone de dépôt */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <Upload className="h-5 w-5 text-primary shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium truncate max-w-[300px]">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium">Glissez un fichier ici ou cliquez pour parcourir</p>
                <p className="text-xs text-muted-foreground">.exe, .deb, .AppImage, .dmg, .pkg</p>
              </div>
            )}
          </div>

          {/* Version */}
          <div className="space-y-1.5">
            <Label>Version <span className="text-destructive">*</span></Label>
            <Input
              placeholder="ex : 1.2.3"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>

          {/* Plateforme + Architecture */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Plateforme <span className="text-destructive">*</span></Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLATFORM_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Architecture</Label>
              <Select value={arch} onValueChange={setArch}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="x64">x64 (Intel/AMD)</SelectItem>
                  <SelectItem value="arm64">arm64 (ARM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Changelog */}
          <div className="space-y-1.5">
            <Label>Notes de version <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
            <Textarea
              placeholder="Corrections de bugs, nouvelles fonctionnalités…"
              rows={3}
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
            />
          </div>
        </div>

        {thisUploadActive && (
          <div className="space-y-1.5 px-1 pb-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progress < 100 ? 'Transfert en cours…' : 'Traitement MinIO…'}</span>
              <span className="font-semibold tabular-nums text-primary">{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {thisUploadActive ? (
            <Button variant="outline" onClick={handleBackground} className="w-full sm:w-auto">
              <Upload className="h-4 w-4 mr-2 animate-pulse" />
              Continuer en arrière-plan
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                <Upload className="h-4 w-4 mr-2" />
                Publier la release
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
