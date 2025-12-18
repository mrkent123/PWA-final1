import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Hotspot {
  id: string;
  x: string;
  y: string;
  width: string;
  height: string;
  action: string;
  field?: string;
  target?: string;
  inputType?: string;
  placeholder?: string;
  credentials?: {
    mst: string;
    password: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class HotspotService {
  private hotspotData: { [screenId: string]: Hotspot[] } = {};
  private currentHotspotsSubject = new BehaviorSubject<Hotspot[]>([]);

  public currentHotspots$ = this.currentHotspotsSubject.asObservable();

  constructor() {}

  async loadHotspotData(): Promise<void> {
    try {
      const hotspotRes = await fetch('assets/hotspot.json');
      this.hotspotData = await hotspotRes.json();
    } catch (error) {
      console.error('Failed to load hotspot data:', error);
      throw new Error('Unable to load hotspot configuration');
    }
  }

  getHotspotsForScreen(screenId: string): Hotspot[] {
    return this.hotspotData[screenId] || [];
  }

  setCurrentScreen(screenId: string): void {
    const hotspots = this.getHotspotsForScreen(screenId);
    this.currentHotspotsSubject.next(hotspots);
  }

  validateHotspot(hotspot: Hotspot): boolean {
    if (!hotspot.id || typeof hotspot.id !== 'string') {
      console.warn('Invalid hotspot: missing or invalid id');
      return false;
    }

    if (!hotspot.x || !hotspot.y || !hotspot.width || !hotspot.height) {
      console.warn(`Invalid hotspot ${hotspot.id}: missing position/dimension`);
      return false;
    }

    if (!hotspot.action || typeof hotspot.action !== 'string') {
      console.warn(`Invalid hotspot ${hotspot.id}: missing or invalid action`);
      return false;
    }

    // Validate percentage values
    const x = parseFloat(hotspot.x);
    const y = parseFloat(hotspot.y);
    const width = parseFloat(hotspot.width);
    const height = parseFloat(hotspot.height);

    if (isNaN(x) || x < 0 || x > 100 ||
        isNaN(y) || y < 0 || y > 100 ||
        isNaN(width) || width <= 0 || width > 100 ||
        isNaN(height) || height <= 0 || height > 100) {
      console.warn(`Invalid hotspot ${hotspot.id}: invalid percentage values`);
      return false;
    }

    return true;
  }

  sanitizeInput(input: string): string {
    // Basic XSS prevention - remove potentially dangerous characters
    return input
      .replace(/[<>\"'&]/g, '') // Remove HTML characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  validateCredentials(hotspot: Hotspot, mst: string, password: string): boolean {
    if (!hotspot.credentials) {
      console.warn(`Hotspot ${hotspot.id} has no credentials configured`);
      return false;
    }

    const sanitizedMst = this.sanitizeInput(mst);
    const sanitizedPassword = this.sanitizeInput(password);

    return sanitizedMst === hotspot.credentials.mst &&
           sanitizedPassword === hotspot.credentials.password;
  }

  processHotspotAction(hotspot: Hotspot, inputValues: { [key: string]: string }): {
    action: string;
    success: boolean;
    data?: any;
    error?: string;
  } {
    try {
      switch (hotspot.action) {
        case 'input':
          if (!hotspot.field) {
            return { action: 'input', success: false, error: 'Missing field configuration' };
          }
          return {
            action: 'input',
            success: true,
            data: { field: hotspot.field, inputType: hotspot.inputType || 'text' }
          };

        case 'navigate':
          if (!hotspot.target) {
            return { action: 'navigate', success: false, error: 'Missing target screen' };
          }
          return {
            action: 'navigate',
            success: true,
            data: { target: hotspot.target }
          };

        case 'login':
          if (!hotspot.credentials) {
            return { action: 'login', success: false, error: 'Missing credentials configuration' };
          }

          const mst = inputValues['mst'];
          const password = inputValues['password'];

          if (!mst || !password) {
            return { action: 'login', success: false, error: 'Missing required input values' };
          }

          const isValid = this.validateCredentials(hotspot, mst, password);
          if (!isValid) {
            return { action: 'login', success: false, error: 'Invalid credentials' };
          }

          return {
            action: 'login',
            success: true,
            data: { target: hotspot.target }
          };

        default:
          return { action: hotspot.action, success: false, error: `Unknown action: ${hotspot.action}` };
      }
    } catch (error) {
      console.error(`Error processing hotspot action:`, error);
      return { action: hotspot.action, success: false, error: 'Processing error' };
    }
  }

  getCurrentHotspots(): Hotspot[] {
    return this.currentHotspotsSubject.value;
  }

  addHotspot(screenId: string, hotspot: Hotspot): void {
    if (!this.hotspotData[screenId]) {
      this.hotspotData[screenId] = [];
    }

    this.hotspotData[screenId].push(hotspot);
    this.updateHotspotFile();

    // Nếu đang là màn hình hiện tại, cập nhật observable
    if (screenId === this.currentHotspotsSubject.value[0]?.id.split('_')[0] ||
        (this.currentHotspotsSubject.value.length > 0 && screenId)) {
      this.setCurrentScreen(screenId);
    }
  }

  updateHotspot(screenId: string, updatedHotspot: Hotspot): void {
    if (this.hotspotData[screenId]) {
      const index = this.hotspotData[screenId].findIndex(h => h.id === updatedHotspot.id);
      if (index !== -1) {
        this.hotspotData[screenId][index] = updatedHotspot;
        this.updateHotspotFile();

        // Nếu đang là màn hình hiện tại, cập nhật observable
        if (screenId === this.currentHotspotsSubject.value[0]?.id.split('_')[0] ||
            (this.currentHotspotsSubject.value.length > 0 && screenId)) {
          this.setCurrentScreen(screenId);
        }
      }
    }
  }

  updateHotspotFile(): string {
    // Trả về chuỗi JSON để người dùng có thể lưu thủ công
    const hotspotJson = JSON.stringify({ screens: this.hotspotData }, null, 2);
    console.log('Updated hotspot.json content:', hotspotJson);

    // Có thể hiện thị hoặc lưu vào clipboard
    navigator.clipboard?.writeText(hotspotJson).then(() => {
      console.log('Hotspot JSON copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy to clipboard: ', err);
    });

    return hotspotJson;
  }

  getHotspotData(): { [screenId: string]: Hotspot[] } {
    return this.hotspotData;
  }
}
