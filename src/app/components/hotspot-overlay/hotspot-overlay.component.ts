import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Hotspot } from '../../services/hotspot.service';

@Component({
  selector: 'app-hotspot-overlay',
  templateUrl: './hotspot-overlay.component.html',
  styleUrls: ['./hotspot-overlay.component.scss'],
  standalone: true,
  imports: [CommonModule],
  host: {
    'role': 'region',
    'aria-label': 'Vùng tương tác hotspot'
  }
})
export class HotspotOverlayComponent {
  @Input() hotspots: Hotspot[] = [];
  @Input() inputValues: { [key: string]: string } = {};
  @Input() isScrollable = false;

  @Output() hotspotClick = new EventEmitter<Hotspot>();
  @Output() hotspotFocus = new EventEmitter<Hotspot>();
  @Output() hotspotBlur = new EventEmitter<Hotspot>();

  focusedHotspotIndex = -1;

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.hotspots.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        this.focusNextHotspot();
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        this.focusPreviousHotspot();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.focusedHotspotIndex >= 0) {
          this.onHotspotClick(this.hotspots[this.focusedHotspotIndex]);
        }
        break;
      case 'Tab':
        // Allow default tab behavior to move to next focusable element
        this.focusedHotspotIndex = -1;
        break;
    }
  }

  private focusNextHotspot(): void {
    if (this.hotspots.length === 0) return;
    this.focusedHotspotIndex = (this.focusedHotspotIndex + 1) % this.hotspots.length;
    this.announceHotspot(this.hotspots[this.focusedHotspotIndex]);
  }

  private focusPreviousHotspot(): void {
    if (this.hotspots.length === 0) return;
    this.focusedHotspotIndex = this.focusedHotspotIndex <= 0
      ? this.hotspots.length - 1
      : this.focusedHotspotIndex - 1;
    this.announceHotspot(this.hotspots[this.focusedHotspotIndex]);
  }

  private announceHotspot(hotspot: Hotspot): void {
    const announcement = `Hotspot ${hotspot.id}: ${this.getHotspotDescription(hotspot)}`;
    this.announceToScreenReader(announcement);
  }

  private announceToScreenReader(message: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';

    document.body.appendChild(announcement);
    announcement.textContent = message;

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  onHotspotClick(hotspot: Hotspot): void {
    this.hotspotClick.emit(hotspot);
  }

  onHotspotFocus(hotspot: Hotspot, index: number): void {
    this.focusedHotspotIndex = index;
    this.hotspotFocus.emit(hotspot);
  }

  onHotspotBlur(hotspot: Hotspot): void {
    this.hotspotBlur.emit(hotspot);
  }

  getHotspotDescription(hotspot: Hotspot): string {
    switch (hotspot.action) {
      case 'input':
        return `Trường nhập ${hotspot.field} - giá trị hiện tại: ${this.inputValues[hotspot.field || ''] || 'trống'}`;
      case 'navigate':
        return `Điều hướng đến ${hotspot.target}`;
      case 'login':
        return 'Nút đăng nhập';
      default:
        return `Hành động ${hotspot.action}`;
    }
  }

  trackByHotspotId(index: number, hotspot: Hotspot): string {
    return hotspot.id;
  }
}
