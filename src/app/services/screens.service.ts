import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Screen {
  src: string;
  id: string;
  type?: string;
  images?: string[];
  pinnedHeaderHeight?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScreensService {
  private screens: Screen[] = [];
  private currentIndexSubject = new BehaviorSubject<number>(0);
  private screensSubject = new BehaviorSubject<Screen[]>([]);

  public currentIndex$ = this.currentIndexSubject.asObservable();
  public screens$ = this.screensSubject.asObservable();

  constructor() {}

  async loadScreens(): Promise<void> {
    try {
      const res = await fetch('assets/screens.json');
      this.screens = await res.json();

      // Tự động phát hiện loại ảnh (dài/ngang) và cập nhật thông tin
      this.screens = await this.processScreenTypes(this.screens);

      this.screensSubject.next(this.screens);

      // Set initial screen based on workflow
      const initialId = await this.getInitialScreenId();
      const initialIndex = this.screens.findIndex(screen => screen.id === initialId);
      if (initialIndex >= 0) {
        this.setCurrentIndex(initialIndex);
      }
    } catch (error) {
      console.error('Failed to load screens:', error);
      throw new Error('Unable to load screen data');
    }
  }

  private async processScreenTypes(screens: Screen[]): Promise<Screen[]> {
    const processedScreens = [];

    for (const screen of screens) {
      const processedScreen = { ...screen };

      try {
        // Tạo một ảnh ẩn để kiểm tra kích thước
        const img = new Image();
        img.src = screen.src;

        // Set timeout để tránh chờ quá lâu
        const imageLoadPromise = new Promise<Screen>((resolve) => {
          const timeout = setTimeout(() => {
            // Nếu load quá 2 giây, mặc định là static
            processedScreen.type = processedScreen.type || 'static';
            resolve(processedScreen);
          }, 2000);

          img.onload = () => {
            clearTimeout(timeout);
            try {
              // Tính tỷ lệ khung hình: nếu chiều cao > 1.5 lần chiều rộng thì coi là ảnh scrollable
              const aspectRatio = img.height / img.width;

              // Nếu tỷ lệ > 1.5 (ảnh dài), đánh dấu là scrollable, ngược lại là static
              if (aspectRatio > 1.5) {
                processedScreen.type = 'scrollable';
                // Xác định phần header nếu cần
                processedScreen.pinnedHeaderHeight = processedScreen.pinnedHeaderHeight || '20%';
              } else {
                processedScreen.type = 'static';
              }
            } catch (error) {
              console.warn(`Failed to process image dimensions for ${screen.src}:`, error);
              processedScreen.type = processedScreen.type || 'static';
            }
            resolve(processedScreen);
          };

          img.onerror = () => {
            clearTimeout(timeout);
            console.warn(`Failed to load image: ${screen.src}, using fallback type`);
            // Nếu không tải được ảnh, mặc định là static
            processedScreen.type = processedScreen.type || 'static';
            resolve(processedScreen);
          };
        });

        const processed = await imageLoadPromise;
        processedScreens.push(processed);

      } catch (error) {
        console.error(`Error processing screen ${screen.src}:`, error);
        // Fallback: giữ nguyên type từ screens.json hoặc mặc định static
        processedScreen.type = processedScreen.type || 'static';
        processedScreens.push(processedScreen);
      }
    }

    return processedScreens;
  }

  private async getInitialScreenId(): Promise<string> {
    try {
      const workflowRes = await fetch('assets/workflows.json');
      const workflows = await workflowRes.json();
      return workflows.initialScreen;
    } catch (error) {
      console.error('Failed to load workflows:', error);
      return 'login'; // fallback
    }
  }

  getScreens(): Screen[] {
    return [...this.screens];
  }

  getCurrentScreen(): Screen | null {
    return this.screens[this.currentIndexSubject.value] || null;
  }

  getCurrentIndex(): number {
    return this.currentIndexSubject.value;
  }

  setCurrentIndex(index: number): void {
    if (index >= 0 && index < this.screens.length) {
      this.currentIndexSubject.next(index);
    }
  }

  navigateToScreen(screenId: string): boolean {
    const targetIndex = this.screens.findIndex(screen => screen.id === screenId);
    if (targetIndex >= 0) {
      this.setCurrentIndex(targetIndex);
      return true;
    }
    return false;
  }

  nextScreen(): boolean {
    const currentScreen = this.getCurrentScreen();
    if (currentScreen?.type !== 'scrollable' && this.currentIndexSubject.value < this.screens.length - 1) {
      this.setCurrentIndex(this.currentIndexSubject.value + 1);
      return true;
    }
    return false;
  }

  previousScreen(): boolean {
    const currentScreen = this.getCurrentScreen();
    if (currentScreen?.type !== 'scrollable' && this.currentIndexSubject.value > 0) {
      this.setCurrentIndex(this.currentIndexSubject.value - 1);
      return true;
    }
    return false;
  }

  get isScrollableScreen(): boolean {
    return this.getCurrentScreen()?.type === 'scrollable';
  }
}
