import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Menu, BookOpen, Home, Moon, Sun, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { useTheme } from 'next-themes';

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface EpubReaderProps {
  chapters: Chapter[];
  bookTitle: string;
  cover?: string;
  onClose: () => void;
}

export function EpubReader({ chapters, bookTitle, cover, onClose }: EpubReaderProps) {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fontSize, setFontSize] = useState<'small' | 'normal' | 'large' | 'extra-large'>('normal');
  const { theme, setTheme } = useTheme();

  const currentChapter = chapters[currentChapterIndex];
  const totalChapters = chapters.length;

  useEffect(() => {
    const progressValue = ((currentChapterIndex + 1) / totalChapters) * 100;
    setProgress(progressValue);
  }, [currentChapterIndex, totalChapters]);

  const goToChapter = (index: number) => {
    if (index >= 0 && index < totalChapters) {
      setCurrentChapterIndex(index);
    }
  };

  const nextChapter = () => goToChapter(currentChapterIndex + 1);
  const prevChapter = () => goToChapter(currentChapterIndex - 1);

  const increaseFontSize = () => {
    const sizes: Array<typeof fontSize> = ['small', 'normal', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex < sizes.length - 1) {
      setFontSize(sizes[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const sizes: Array<typeof fontSize> = ['small', 'normal', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex > 0) {
      setFontSize(sizes[currentIndex - 1]);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const TableOfContents = () => (
    <div className="p-4 space-y-2">
      <h3 className="font-semibold text-primary mb-4">Table of Contents</h3>
      {chapters.map((chapter, index) => (
        <button
          key={chapter.id}
          onClick={() => goToChapter(index)}
          className={`
            w-full text-left p-3 rounded-lg transition-colors text-sm
            ${index === currentChapterIndex 
              ? 'bg-accent text-accent-foreground font-medium' 
              : 'hover:bg-muted text-muted-foreground'
            }
          `}
        >
          <div className="truncate">{chapter.title}</div>
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/50 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="hover:bg-accent/80 transition-colors"
            >
              <Home className="h-4 w-4" />
            </Button>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-accent/80 transition-colors">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <TableOfContents />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-semibold text-primary truncate max-w-48 tracking-tight">
                {bookTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Reading Controls */}
            <div className="flex items-center gap-1 mr-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={decreaseFontSize}
                disabled={fontSize === 'small'}
                className="h-8 w-8 hover:bg-accent/80"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={increaseFontSize}
                disabled={fontSize === 'extra-large'}
                className="h-8 w-8 hover:bg-accent/80"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8 hover:bg-accent/80"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground font-medium">
              {currentChapterIndex + 1} of {totalChapters}
            </div>
          </div>
        </div>
        
        <Progress value={progress} className="h-1 bg-muted" />
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Chapter Navigation */}
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevChapter}
            disabled={currentChapterIndex === 0}
            className="h-12 w-12 rounded-full bg-card/80 backdrop-blur-sm shadow-lg hover:bg-accent"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40">
          <Button
            variant="ghost"
            size="icon"
            onClick={nextChapter}
            disabled={currentChapterIndex === totalChapters - 1}
            className="h-12 w-12 rounded-full bg-card/80 backdrop-blur-sm shadow-lg hover:bg-accent"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Chapter Content */}
        <main className="flex-1 max-w-4xl mx-auto px-6 py-8">
          <Card className="p-8 md:p-12 shadow-lg border-0 bg-card/50 backdrop-blur-sm">
            <article className="space-y-8">
              <header className="border-b border-border/30 pb-8">
                <h1 className="text-3xl md:text-4xl font-elegant font-semibold text-primary tracking-tight leading-tight">
                  {currentChapter?.title}
                </h1>
              </header>
              
              {/* Show cover image on first chapter if available */}
              {currentChapterIndex === 0 && cover && (
                <div className="flex justify-center mb-12">
                  <img 
                    src={cover} 
                    alt={`${bookTitle} cover`}
                    className="max-w-sm max-h-96 object-contain rounded-xl shadow-2xl border border-border/20"
                  />
                </div>
              )}
              
              <div 
                className={`chapter-content reading-text zoom-${fontSize} prose prose-lg max-w-none prose-headings:text-primary prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground`}
                dangerouslySetInnerHTML={{ 
                  __html: currentChapter?.content || '' 
                }}
              />
            </article>
          </Card>

          {/* Chapter Navigation Footer */}
          <div className="flex justify-between items-center mt-12 px-4">
            <Button
              variant="outline"
              onClick={prevChapter}
              disabled={currentChapterIndex === 0}
              className="flex items-center gap-2 hover:bg-accent/80 transition-colors border-border/50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <span className="text-sm text-muted-foreground font-medium">
              Chapter {currentChapterIndex + 1} of {totalChapters}
            </span>

            <Button
              variant="outline"
              onClick={nextChapter}
              disabled={currentChapterIndex === totalChapters - 1}
              className="flex items-center gap-2 hover:bg-accent/80 transition-colors border-border/50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}