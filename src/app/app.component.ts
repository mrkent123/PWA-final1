import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [CommonModule, IonApp, IonRouterOutlet],
})
export class AppComponent {
  showDeviceFrame = true;

  constructor() {
    // Auto-disable frame on mobile devices
    this.checkDeviceType();
  }

  private checkDeviceType(): void {
    const isMobile = window.innerWidth <= 430;
    this.showDeviceFrame = !isMobile;
  }

  toggleDeviceFrame(): void {
    this.showDeviceFrame = !this.showDeviceFrame;
  }
}
