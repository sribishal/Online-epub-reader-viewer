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
  chapters: EpubChapter[];
}

export class EpubParser {
  private zip: JSZip | null = null;
  private opfPath: string = '';
  private basePath: string = '';

  async parseEpub(file: File): Promise<EpubMetadata> {
    try {
      this.zip = await JSZip.loadAsync(file);
      
      // Find the OPF file
      await this.findOpfFile();
      
      // Parse metadata and chapters
      const metadata = await this.extractMetadata();
      const chapters = await this.extractChapters();

      return {
        ...metadata,
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
        const cleanContent = this.cleanHtmlContent(content);
        const title = this.extractChapterTitle(content) || `Chapter ${i + 1}`;

        chapters.push({
          id: idref,
          title,
          content: cleanContent,
          order: i
        });
      } catch (error) {
        console.warn(`Failed to process chapter ${href}:`, error);
      }
    }

    return chapters;
  }

  private cleanHtmlContent(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove script and style tags
    const scripts = doc.querySelectorAll('script, style');
    scripts.forEach(el => el.remove());

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

  private extractChapterTitle(html: string): string | null {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Try to find title in various elements
    const titleElement = doc.querySelector('h1, h2, h3, title');
    return titleElement?.textContent?.trim() || null;
  }
}