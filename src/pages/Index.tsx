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
        cover={epubData.cover}
        onClose={handleCloseReader}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-elegant font-semibold text-primary tracking-tight">
                EPUB Reader
              </h1>
              <p className="text-muted-foreground font-medium">
                Upload and read your favorite books with modern elegance
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
