import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-screens',
  templateUrl: './screens.component.html',
  styleUrls: ['./screens.component.scss'],
  standalone: true,
  imports: [CommonModule, IonContent],
})
export class ScreensComponent {
  images: { src: string; id: string }[] = [];
  currentIndex = 0;
  hotspots: any[] = [];
  workflows: any = {};
  mockData: any = {};

  async ngOnInit() {
    // Đọc file screens.json trong thư mục assets
    const res = await fetch('assets/screens.json');
    this.images = await res.json();

    // Đọc workflows.json
    const workflowRes = await fetch('workflows.json');
    this.workflows = await workflowRes.json();

    // Đọc hotspot.json
    const hotspotRes = await fetch('hotspot.json');
    const hotspotData = await hotspotRes.json();

    // Set initial screen
    const initialId = this.workflows.initialScreen;
    const initialIndex = this.images.findIndex(img => img.id === initialId);
    if (initialIndex >= 0) {
      this.currentIndex = initialIndex;
    }

    // Load hotspots for current screen
    this.loadHotspotsForCurrentScreen(hotspotData);
  }

  loadHotspotsForCurrentScreen(hotspotData: any) {
    const currentScreenId = this.images[this.currentIndex]?.id;
    if (currentScreenId && hotspotData.screens[currentScreenId]) {
      this.hotspots = hotspotData.screens[currentScreenId];
    } else {
      this.hotspots = [];
    }
  }

  async nextImage() {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
      const hotspotData = await this.getHotspotData();
      this.loadHotspotsForCurrentScreen(hotspotData);
    }
  }

  async prevImage() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      const hotspotData = await this.getHotspotData();
      this.loadHotspotsForCurrentScreen(hotspotData);
    }
  }

  async getHotspotData() {
    const hotspotRes = await fetch('hotspot.json');
    return await hotspotRes.json();
  }

  async onHotspotClick(hotspot: any) {
    console.log('Hotspot clicked:', hotspot.id);

    if (hotspot.action === 'navigate' && hotspot.target) {
      const targetIndex = this.images.findIndex(img => img.id === hotspot.target);
      if (targetIndex >= 0) {
        this.currentIndex = targetIndex;
        const hotspotData = await this.getHotspotData();
        this.loadHotspotsForCurrentScreen(hotspotData);
      }
    }
  }
}
