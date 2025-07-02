import JSZip from 'jszip';

export interface EpubChapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface EpubMetadata {
  title: string;
  author: string;
  cover?: string;
  chapters: EpubChapter[];
}

export class EpubParser {
  private zip: JSZip | null = null;
  private opfPath: string = '';
  private basePath: string = '';
  private imageCache: Map<string, string> = new Map();

  async parseEpub(file: File): Promise<EpubMetadata> {
    try {
      this.zip = await JSZip.loadAsync(file);
      
      // Find the OPF file
      await this.findOpfFile();
      
      // Parse metadata, cover, and chapters
      const metadata = await this.extractMetadata();
      const cover = await this.extractCover();
      const chapters = await this.extractChapters();

      return {
        ...metadata,
        cover,
        chapters: chapters.sort((a, b) => a.order - b.order)
      };
    } catch (error) {
      console.error('Error parsing EPUB:', error);
      throw new Error('Failed to parse EPUB file. Please ensure it is a valid EPUB.');
    }
  }

  private async findOpfFile(): Promise<void> {
    // First, try to find container.xml
    const containerFile = this.zip?.file('META-INF/container.xml');
    if (containerFile) {
      const containerContent = await containerFile.async('text');
      const parser = new DOMParser();
      const containerXml = parser.parseFromString(containerContent, 'text/xml');
      const opfPath = containerXml.querySelector('rootfile')?.getAttribute('full-path');
      
      if (opfPath) {
        this.opfPath = opfPath;
        this.basePath = opfPath.substring(0, opfPath.lastIndexOf('/'));
        return;
      }
    }

    // Fallback: look for .opf files
    const opfFiles = Object.keys(this.zip?.files || {}).filter(name => name.endsWith('.opf'));
    if (opfFiles.length > 0) {
      this.opfPath = opfFiles[0];
      this.basePath = this.opfPath.substring(0, this.opfPath.lastIndexOf('/'));
      return;
    }

    throw new Error('Could not find OPF file in EPUB');
  }

  private async extractMetadata(): Promise<{ title: string; author: string }> {
    const opfFile = this.zip?.file(this.opfPath);
    if (!opfFile) throw new Error('OPF file not found');

    const opfContent = await opfFile.async('text');
    const parser = new DOMParser();
    const opfXml = parser.parseFromString(opfContent, 'text/xml');

    const title = opfXml.querySelector('dc\\:title, title')?.textContent || 'Unknown Title';
    const author = opfXml.querySelector('dc\\:creator, creator')?.textContent || 'Unknown Author';

    return { title, author };
  }

  private async extractCover(): Promise<string | undefined> {
    try {
      const opfFile = this.zip?.file(this.opfPath);
      if (!opfFile) return undefined;

      const opfContent = await opfFile.async('text');
      const parser = new DOMParser();
      const opfXml = parser.parseFromString(opfContent, 'text/xml');

      // Look for cover in metadata
      const coverMeta = opfXml.querySelector('meta[name="cover"]');
      if (coverMeta) {
        const coverId = coverMeta.getAttribute('content');
        if (coverId) {
          const coverItem = opfXml.querySelector(`manifest item[id="${coverId}"]`);
          const coverHref = coverItem?.getAttribute('href');
          if (coverHref) {
            return await this.getImageAsBlob(coverHref);
          }
        }
      }

      // Fallback: look for cover.jpg or similar
      const coverFiles = ['cover.jpg', 'cover.jpeg', 'cover.png', 'Cover.jpg', 'Cover.jpeg', 'Cover.png'];
      for (const coverFile of coverFiles) {
        const fullPath = this.basePath ? `${this.basePath}/${coverFile}` : coverFile;
        const file = this.zip?.file(fullPath);
        if (file) {
          return await this.getImageAsBlob(coverFile);
        }
      }

      return undefined;
    } catch (error) {
      console.warn('Failed to extract cover:', error);
      return undefined;
    }
  }

  private async extractChapters(): Promise<EpubChapter[]> {
    const opfFile = this.zip?.file(this.opfPath);
    if (!opfFile) throw new Error('OPF file not found');

    const opfContent = await opfFile.async('text');
    const parser = new DOMParser();
    const opfXml = parser.parseFromString(opfContent, 'text/xml');

    // Get spine items (reading order)
    const spineItems = Array.from(opfXml.querySelectorAll('spine itemref'));
    const chapters: EpubChapter[] = [];

    for (let i = 0; i < spineItems.length; i++) {
      const itemref = spineItems[i];
      const idref = itemref.getAttribute('idref');
      
      if (!idref) continue;

      // Find the corresponding manifest item
      const manifestItem = opfXml.querySelector(`manifest item[id="${idref}"]`);
      const href = manifestItem?.getAttribute('href');
      
      if (!href) continue;

      const fullPath = this.basePath ? `${this.basePath}/${href}` : href;
      const chapterFile = this.zip?.file(fullPath);
      
      if (!chapterFile) continue;

      try {
        const content = await chapterFile.async('text');
        const processedContent = await this.processContent(content);
        const title = this.extractChapterTitle(content, opfXml, idref) || `Chapter ${i + 1}`;

        chapters.push({
          id: idref,
          title,
          content: processedContent,
          order: i
        });
      } catch (error) {
        console.warn(`Failed to process chapter ${href}:`, error);
      }
    }

    return chapters;
  }

  private async processContent(html: string): Promise<string> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove script and style tags
    const scripts = doc.querySelectorAll('script, style');
    scripts.forEach(el => el.remove());

    // Process images
    const images = doc.querySelectorAll('img');
    for (const img of images) {
      const src = img.getAttribute('src');
      if (src) {
        const blobUrl = await this.getImageAsBlob(src);
        if (blobUrl) {
          img.setAttribute('src', blobUrl);
        }
      }
    }

    // Get the body content or the whole document if no body
    const body = doc.body || doc.documentElement;
    
    // Clean up the HTML while preserving structure
    return body.innerHTML
      .replace(/<\/?html[^>]*>/gi, '')
      .replace(/<\/?head[^>]*>/gi, '')
      .replace(/<\/?body[^>]*>/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async getImageAsBlob(imagePath: string): Promise<string | null> {
    try {
      // Check cache first
      if (this.imageCache.has(imagePath)) {
        return this.imageCache.get(imagePath)!;
      }

      // Clean the path and try different variations
      const cleanPath = imagePath.replace(/^\.\//, '');
      const possiblePaths = [
        cleanPath,
        this.basePath ? `${this.basePath}/${cleanPath}` : cleanPath,
        imagePath,
        this.basePath ? `${this.basePath}/${imagePath}` : imagePath
      ];

      for (const path of possiblePaths) {
        const imageFile = this.zip?.file(path);
        if (imageFile) {
          const blob = await imageFile.async('blob');
          const blobUrl = URL.createObjectURL(blob);
          this.imageCache.set(imagePath, blobUrl);
          return blobUrl;
        }
      }

      return null;
    } catch (error) {
      console.warn(`Failed to load image ${imagePath}:`, error);
      return null;
    }
  }

  private extractChapterTitle(html: string, opfXml: Document, chapterId: string): string | null {
    // First try to get title from the manifest
    const manifestItem = opfXml.querySelector(`manifest item[id="${chapterId}"]`);
    const manifestTitle = manifestItem?.getAttribute('title');
    if (manifestTitle) {
      return manifestTitle;
    }

    // Try to get title from NCX/TOC if available
    const navPoint = opfXml.querySelector(`navPoint[playOrder] text`);
    if (navPoint?.textContent) {
      return navPoint.textContent.trim();
    }

    // Parse HTML content for title
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Try to find title in various elements, prioritizing h1
    const titleElement = doc.querySelector('h1') || 
                        doc.querySelector('h2') || 
                        doc.querySelector('h3') ||
                        doc.querySelector('title') ||
                        doc.querySelector('.chapter-title') ||
                        doc.querySelector('.title');
    
    const title = titleElement?.textContent?.trim();
    
    // Clean up common chapter prefixes and artifacts
    if (title) {
      return title
        .replace(/^(Chapter|CHAPTER|Ch\.?)\s*\d*:?\s*/i, '')
        .replace(/^\d+\.?\s*/, '')
        .trim();
    }
    
    return null;
  }
}