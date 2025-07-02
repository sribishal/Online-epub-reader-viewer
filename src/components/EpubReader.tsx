import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Menu, BookOpen, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface EpubReaderProps {
  chapters: Chapter[];
  bookTitle: string;
  onClose: () => void;
}

export function EpubReader({ chapters, bookTitle, onClose }: EpubReaderProps) {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [progress, setProgress] = useState(0);

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
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="hover:bg-accent"
            >
              <Home className="h-4 w-4" />
            </Button>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-accent">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <TableOfContents />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary truncate max-w-48">
                {bookTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{currentChapterIndex + 1} of {totalChapters}</span>
          </div>
        </div>
        
        <Progress value={progress} className="h-1" />
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
          <Card className="p-8 md:p-12">
            <article className="space-y-6">
              <header className="border-b border-border pb-6">
                <h1 className="text-2xl md:text-3xl font-serif font-semibold text-primary">
                  {currentChapter?.title}
                </h1>
              </header>
              
              <div 
                className="chapter-content reading-text"
                dangerouslySetInnerHTML={{ 
                  __html: currentChapter?.content || '' 
                }}
              />
            </article>
          </Card>

          {/* Chapter Navigation Footer */}
          <div className="flex justify-between items-center mt-8 px-4">
            <Button
              variant="outline"
              onClick={prevChapter}
              disabled={currentChapterIndex === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <span className="text-sm text-muted-foreground">
              Chapter {currentChapterIndex + 1} of {totalChapters}
            </span>

            <Button
              variant="outline"
              onClick={nextChapter}
              disabled={currentChapterIndex === totalChapters - 1}
              className="flex items-center gap-2"
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