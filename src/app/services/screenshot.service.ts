import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import html2canvas from 'html2canvas';
import domtoimage from 'dom-to-image';

@Injectable({
  providedIn: 'root'
})
export class ScreenshotService {
  private isCapturingSubject = new BehaviorSubject<boolean>(false);
  private lastCaptureTime = 0;
  private readonly DEBOUNCE_MS = 500;

  public isCapturing$ = this.isCapturingSubject.asObservable();

  constructor() {}

  async captureAndDownloadScreenshot(elementSelector: string = '.screens-content'): Promise<void> {
    // Debounce check
    const now = Date.now();
    if (now - this.lastCaptureTime < this.DEBOUNCE_MS) {
      console.warn('Screenshot capture debounced - too frequent calls');
      return;
    }

    if (this.isCapturingSubject.value) {
      console.warn('Screenshot capture already in progress');
      return;
    }

    try {
      this.isCapturingSubject.next(true);
      this.lastCaptureTime = now;

      const element = document.querySelector(elementSelector) as HTMLElement;
      if (!element) {
        throw new Error('Screenshot target element not found');
      }

      // Try html2canvas first, fallback to dom-to-image
      let dataUrl: string;
      try {
        dataUrl = await this.captureWithHtml2Canvas(element);
      } catch (html2canvasError) {
        console.warn('html2canvas failed, trying dom-to-image:', html2canvasError);
        dataUrl = await this.captureWithDomToImage(element);
      }

      await this.downloadImage(dataUrl, `screen-${Date.now()}.png`);

    } catch (error) {
      console.error('Screenshot capture failed:', error);
      throw error; // Re-throw for component handling
    } finally {
      this.isCapturingSubject.next(false);
    }
  }

  private async captureWithHtml2Canvas(element: HTMLElement): Promise<string> {
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      scale: 1,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#000000',
      logging: false, // Disable html2canvas logging
      ignoreElements: (element) => {
        // Skip elements that might cause issues
        return element.classList.contains('konva-overlay') ||
               element.tagName === 'BUTTON' && element.textContent?.includes('📸');
      }
    });

    return canvas.toDataURL('image/png');
  }

  private async captureWithDomToImage(element: HTMLElement): Promise<string> {
    return await domtoimage.toPng(element, {
      width: window.innerWidth,
      height: window.innerHeight,
      bgcolor: '#000000',
      quality: 1,
      filter: (node) => {
        // Skip problematic elements
        if (node.nodeType !== Node.ELEMENT_NODE) return true;
        const element = node as HTMLElement;
        return !element.classList?.contains('konva-overlay') &&
               !(element.tagName === 'BUTTON' && element.textContent?.includes('📸'));
      }
    });
  }

  private async downloadImage(dataUrl: string, filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  get isCapturing(): boolean {
    return this.isCapturingSubject.value;
  }

  getRemainingDebounceTime(): number {
    const elapsed = Date.now() - this.lastCaptureTime;
    return Math.max(0, this.DEBOUNCE_MS - elapsed);
  }
}
