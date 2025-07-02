import { useCallback, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EpubUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export function EpubUploader({ onFileSelect, isLoading }: EpubUploaderProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.epub')) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  }, [onFileSelect]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-2xl p-8">
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-12 text-center transition-colors
            ${dragActive ? 'border-primary bg-accent/20' : 'border-muted-foreground/25'}
            ${isLoading ? 'opacity-50 pointer-events-none' : 'hover:border-primary/50'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-accent/10">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-primary">
                Upload your EPUB book
              </h3>
              <p className="text-muted-foreground">
                Drag and drop an EPUB file here, or click to browse
              </p>
            </div>

            <Button 
              variant="outline" 
              className="relative overflow-hidden"
              disabled={isLoading}
            >
              <FileText className="mr-2 h-4 w-4" />
              Choose EPUB File
              <input
                type="file"
                accept=".epub"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </Button>

            <p className="text-xs text-muted-foreground">
              Supports EPUB format only
            </p>
          </div>

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
              <div className="flex items-center gap-2 text-primary">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                <span>Processing EPUB...</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}