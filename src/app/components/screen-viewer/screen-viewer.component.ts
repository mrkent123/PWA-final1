import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { Screen } from '../../services/screens.service';

@Component({
  selector: 'app-screen-viewer',
  templateUrl: './screen-viewer.component.html',
  styleUrls: ['./screen-viewer.component.scss'],
  standalone: true,
  imports: [CommonModule, IonContent]
})
export class ScreenViewerComponent implements OnChanges {
  @Input() currentScreen: Screen | null = null;
  @Input() isScrollableScreen = false;
  @Input() scrollableContentHeight = 0;

  @Output() imageError = new EventEmitter<Event>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentScreen'] && this.currentScreen) {
      console.log('ScreenViewer: Screen changed to:', this.currentScreen.id);
    }
  }

  onImageError(event: Event): void {
    console.error('ScreenViewer: Image failed to load:', (event.target as HTMLImageElement)?.src);
    this.imageError.emit(event);
  }

  trackByImageSrc(index: number, src: string): string {
    return src;
  }
}
