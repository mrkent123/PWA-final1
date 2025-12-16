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
