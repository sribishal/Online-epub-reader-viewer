import { useState } from 'react';
import { EpubUploader } from '@/components/EpubUploader';
import { EpubReader } from '@/components/EpubReader';
import { EpubParser, EpubMetadata } from '@/utils/epubParser';
import { BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [epubData, setEpubData] = useState<EpubMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    
    try {
      const parser = new EpubParser();
      const data = await parser.parseEpub(file);
      setEpubData(data);
      
      toast({
        title: "EPUB loaded successfully!",
        description: `"${data.title}" is ready to read.`,
      });
    } catch (error) {
      console.error('Error parsing EPUB:', error);
      toast({
        title: "Error loading EPUB",
        description: "Please ensure the file is a valid EPUB format.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseReader = () => {
    setEpubData(null);
  };

  if (epubData) {
    return (
      <EpubReader
        chapters={epubData.chapters}
        bookTitle={epubData.title}
        onClose={handleCloseReader}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-semibold text-primary">
                EPUB Reader
              </h1>
              <p className="text-sm text-muted-foreground">
                Upload and read your favorite books online
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <EpubUploader 
          onFileSelect={handleFileSelect} 
          isLoading={isLoading}
        />
      </main>
    </div>
  );
};

export default Index;
