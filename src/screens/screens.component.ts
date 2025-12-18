import { Component, ViewChild, ElementRef, AfterViewInit, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { IosKeyboardComponent } from '../app/components/ios-keyboard/ios-keyboard.component';
import { IosKeyboardService } from '../app/components/ios-keyboard/ios-keyboard.service';
import { ScreenViewerComponent } from '../app/components/screen-viewer/screen-viewer.component';
import { HotspotOverlayComponent } from '../app/components/hotspot-overlay/hotspot-overlay.component';
import { ErrorBoundaryComponent } from '../app/components/error-boundary/error-boundary.component';
import { ScreensService, Screen } from '../app/services/screens.service';
import { HotspotService, Hotspot } from '../app/services/hotspot.service';
import { WorkflowService } from '../app/services/workflow.service';
import { ScreenshotService } from '../app/services/screenshot.service';
import { LocalizationService } from '../app/services/localization.service';
import Konva from 'konva';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-screens',
  templateUrl: './screens.component.html',
  styleUrls: ['./screens.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IosKeyboardComponent,
    ScreenViewerComponent,
    HotspotOverlayComponent,
    ErrorBoundaryComponent
  ],
})
export class ScreensComponent implements OnInit, AfterViewInit, OnDestroy {
  private keyboardService = inject(IosKeyboardService);
  private screensService = inject(ScreensService);
  private hotspotService = inject(HotspotService);
  private workflowService = inject(WorkflowService);
  private screenshotService = inject(ScreenshotService);

  private konvaStage: Konva.Stage | null = null;
  private konvaLayer: Konva.Layer | null = null;
  private transformer: Konva.Transformer | null = null;
  isCreatingHotspot = false;
  private currentRect: Konva.Rect | null = null;
  private subscriptions: Subscription = new Subscription();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  @ViewChild('konvaContainer', { static: false }) konvaContainer!: ElementRef;
  @ViewChild(IosKeyboardComponent) iosKeyboard!: IosKeyboardComponent;

  // Reactive data from services
  currentScreen$ = this.screensService.screens$;
  currentIndex$ = this.screensService.currentIndex$;
  currentHotspots$ = this.hotspotService.currentHotspots$;
  isCapturing$ = this.screenshotService.isCapturing$;

  // Public localization service for template access
  public localizationService = inject(LocalizationService);

  // Input values - bound directly via ngModel
  inputValues: { [key: string]: string } = {
    mst: '',
    password: ''
  };

  // UI state
  showError = false;
  errorMessage = '';
  showSuccess = false;

  async ngOnInit() {
    console.log('🚀 Screens component initializing...');
    try {
      // Initialize all services
      console.log('📦 Loading services...');
      await Promise.all([
        this.screensService.loadScreens(),
        this.hotspotService.loadHotspotData(),
        this.workflowService.loadWorkflow()
      ]);
      console.log('✅ All services loaded successfully');

      // Subscribe to screen changes to update hotspots
      this.subscriptions.add(
        this.currentIndex$.subscribe(index => {
          console.log(`📱 Screen changed to index: ${index}`);
          const currentScreen = this.screensService.getCurrentScreen();
          if (currentScreen) {
            console.log(`🎯 Current screen: ${currentScreen.id} (${currentScreen.type})`);
            this.hotspotService.setCurrentScreen(currentScreen.id);
            this.workflowService.setCurrentStep(currentScreen.id);
            this.drawKonvaHotspots();
          } else {
            console.warn('⚠️ No current screen found');
          }
        })
      );

      console.log('🎉 Screens component initialized successfully');
      this.workflowService.logWorkflowEvent('screens_initialized');
    } catch (error) {
      console.error('❌ Failed to initialize screens component:', error);
      this.showErrorMessage(this.localizationService.translate('dataLoadError'));
      // Don't rethrow - let component render with error state
    }
  }

  ngAfterViewInit() {
    this.initializeKonva();

    // Initial draw of hotspots
    const currentScreen = this.screensService.getCurrentScreen();
    if (currentScreen) {
      this.hotspotService.setCurrentScreen(currentScreen.id);
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.konvaStage) {
      this.konvaStage.destroy();
    }
  }

  get currentScreen(): Screen | null {
    return this.screensService.getCurrentScreen() || null;
  }

  get isScrollableScreen(): boolean {
    return this.screensService.isScrollableScreen;
  }

  navigateToScreen(screenId: string) {
    const success = this.screensService.navigateToScreen(screenId);
    if (success) {
      this.workflowService.logWorkflowEvent('screen_navigated', { from: this.workflowService.getCurrentStep(), to: screenId });
    } else {
      this.showErrorMessage(this.localizationService.translate('navigationError'));
    }
  }

  private showErrorMessage(message: string) {
    this.errorMessage = message;
    this.showError = true;
    setTimeout(() => this.showError = false, 3000);
  }

  onHotspotClick(hotspot: Hotspot) {
    console.log('Hotspot clicked:', hotspot);

    // Handle input hotspots with custom keyboard
    if (hotspot.action === 'input' && hotspot.field && hotspot.inputType) {
      this.showKeyboardForField(hotspot.field, hotspot.inputType, hotspot.placeholder || '');
      return;
    }

    if (hotspot.action === 'navigate' && hotspot.target) {
      this.navigateToScreen(hotspot.target);
    } else if (hotspot.action === 'login') {
      this.handleLogin(hotspot);
    }
  }

  private showKeyboardForField(field: string, inputType: string, placeholder: string) {
    const currentValue = this.inputValues[field] || '';
    const mappedInputType = inputType === 'number' ? 'number' : inputType === 'password' ? 'password' : 'text';

    this.keyboardService.showKeyboard(field, mappedInputType, currentValue, placeholder);
  }

  onKeyboardValueChange(change: { field: string; value: string }) {
    this.inputValues[change.field] = change.value;
  }

  onKeyboardClose() {
    // Keyboard closed, values are already updated via onKeyboardValueChange
  }

  handleLogin(hotspot: Hotspot) {
    const credentials = hotspot.credentials;
    if (!credentials) return;

    const mstValue = this.inputValues['mst'];
    const passwordValue = this.inputValues['password'];

    // Validate inputs
    if (!mstValue || !passwordValue) {
      this.showError = true;
      this.errorMessage = this.localizationService.translate('inputRequired');
      setTimeout(() => this.showError = false, 3000);
      return;
    }

    // Check credentials
    if (mstValue === credentials.mst && passwordValue === credentials.password) {
      this.showSuccess = true;
      setTimeout(() => {
        this.showSuccess = false;
        if (hotspot.target) {
          this.navigateToScreen(hotspot.target);
          // Reset inputs
          this.inputValues = { mst: '', password: '' };
        }
      }, 1000);
    } else {
      this.showError = true;
      this.errorMessage = this.localizationService.translate('loginError');
      setTimeout(() => this.showError = false, 3000);
    }
  }

  // Konva canvas overlay functionality
  private initializeKonva() {
    if (!this.konvaContainer) return;

    const container = this.konvaContainer.nativeElement;
    this.konvaStage = new Konva.Stage({
      container: container,
      width: window.innerWidth,
      height: window.innerHeight,
    });

    this.konvaLayer = new Konva.Layer();
    this.konvaStage.add(this.konvaLayer);

    // Thêm sự kiện click để tạo hotspot mới khi đang ở chế độ tạo
    this.konvaStage.on('mousedown touchstart', (e) => {
      // Chỉ xử lý nếu không click vào một hình chữ nhật hiện có
      if (e.target === this.konvaStage) {
        if (this.isCreatingHotspot) {
          this.startCreatingHotspot(e.evt.clientX || e.evt.touches[0].clientX,
                                   e.evt.clientY || e.evt.touches[0].clientY);
        }
      }
    });

    // Tạo transformer để hỗ trợ kéo rê và thay đổi kích thước
    this.transformer = new Konva.Transformer({
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      anchorSize: 8,
      borderStroke: 'rgba(0, 122, 255, 0.8)',
      borderStrokeWidth: 2,
    });
    this.konvaLayer.add(this.transformer);
  }

  private startCreatingHotspot(startX: number, startY: number) {
    if (!this.konvaLayer) return;

    // Tạo hình chữ nhật mới
    this.currentRect = new Konva.Rect({
      x: startX,
      y: startY,
      width: 1,
      height: 1,
      fill: 'rgba(0, 122, 255, 0.2)',
      stroke: 'rgba(0, 122, 255, 0.8)',
      strokeWidth: 2,
      cornerRadius: 4,
      draggable: true,
    });

    this.konvaLayer.add(this.currentRect);

    // Bắt đầu kéo để tạo hình chữ nhật
    const pos = this.konvaStage?.getPointerPosition();
    if (!pos) return;

    const x = pos.x;
    const y = pos.y;

    this.currentRect.on('mousemove touchmove', () => {
      if (!this.konvaStage || !this.currentRect) return;

      const currentPos = this.konvaStage.getPointerPosition();
      if (!currentPos) return;

      const width = currentPos.x - x;
      const height = currentPos.y - y;

      if (width > 0 && height > 0) {
        this.currentRect.width(width);
        this.currentRect.height(height);
      } else if (width < 0 && height < 0) {
        this.currentRect.x(x + width);
        this.currentRect.y(y + height);
        this.currentRect.width(-width);
        this.currentRect.height(-height);
      } else if (width < 0) {
        this.currentRect.x(x + width);
        this.currentRect.width(-width);
        this.currentRect.height(height);
      } else if (height < 0) {
        this.currentRect.y(y + height);
        this.currentRect.width(width);
        this.currentRect.height(-height);
      }

      this.konvaLayer?.batchDraw();
    });

    this.currentRect.on('mouseup touchend', () => {
      this.currentRect?.off('mousemove touchmove');
      this.currentRect?.off('mouseup touchend');

      if (this.currentRect) {
        // Đảm bảo hình chữ nhật có kích thước hợp lệ
        if (this.currentRect.width() < 10 || this.currentRect.height() < 10) {
          // Xóa hình chữ nhật nếu quá nhỏ
          this.currentRect.destroy();
        } else {
          // Thêm sự kiện click để mở menu chỉnh sửa
          this.currentRect.on('click tap', () => {
            this.selectHotspot(this.currentRect!);
          });

          // Thêm vào transformer để có thể kéo rê và thay đổi kích thước
          this.transformer?.nodes([this.currentRect]);

          // Tạo đối tượng hotspot và lưu vào service
          this.createHotspotFromRect(this.currentRect);
        }
      }
      this.currentRect = null;
      this.isCreatingHotspot = false;
    });
  }

  private selectHotspot(rect: Konva.Rect) {
    if (this.transformer) {
      this.transformer.nodes([rect]);
    }

    // Thêm các sự kiện để cập nhật hotspot khi thay đổi kích thước/vị trí
    rect.on('dragend', () => {
      this.updateHotspotFromRect(rect);
    });

    rect.on('transformend', () => {
      this.updateHotspotFromRect(rect);
    });
  }

  private createHotspotFromRect(rect: Konva.Rect) {
    if (!this.currentScreen) return;

    const screenId = this.currentScreen.id;
    const x = (rect.x() / window.innerWidth) * 100;
    const y = (rect.y() / window.innerHeight) * 100;
    const width = (rect.width() / window.innerWidth) * 100;
    const height = (rect.height() / window.innerHeight) * 100;

    // Tạo hotspot mới
    const newHotspot: Hotspot = {
      id: `hotspot_${Date.now()}`,
      x: `${x.toFixed(2)}%`,
      y: `${y.toFixed(2)}%`,
      width: `${width.toFixed(2)}%`,
      height: `${height.toFixed(2)}%`,
      action: 'navigate',
      target: 'dashboard' // Mặc định
    };

    // Thêm vào service
    this.hotspotService.addHotspot(screenId, newHotspot);
  }

  private updateHotspotFromRect(rect: Konva.Rect) {
    if (!this.currentScreen) return;

    const screenId = this.currentScreen.id;
    const x = (rect.x() / window.innerWidth) * 100;
    const y = (rect.y() / window.innerHeight) * 100;
    const width = (rect.width() / window.innerWidth) * 100;
    const height = (rect.height() / window.innerHeight) * 100;

    // Cập nhật hotspot trong service
    this.hotspotService.updateHotspot(screenId, {
      id: rect.attrs.id || '', // Cần thiết lập id cho rect để nhận diện
      x: `${x.toFixed(2)}%`,
      y: `${y.toFixed(2)}%`,
      width: `${width.toFixed(2)}%`,
      height: `${height.toFixed(2)}%`,
      action: 'navigate',
      target: 'dashboard' // Giữ nguyên action cũ nếu có
    });
  }

  private drawKonvaHotspots() {
    if (!this.konvaLayer) return;

    // Clear existing hotspots but keep transformer
    this.konvaLayer.destroyChildren();

    // Add transformer back to layer
    if (this.transformer) {
      this.konvaLayer.add(this.transformer);
    }

    const hotspots = this.hotspotService.getCurrentHotspots();

    hotspots.forEach((hotspot: Hotspot, index: number) => {
      // Parse percentage values to pixels
      const x = parseFloat(hotspot.x) / 100 * window.innerWidth;
      const y = parseFloat(hotspot.y) / 100 * window.innerHeight;
      const width = parseFloat(hotspot.width) / 100 * window.innerWidth;
      const height = parseFloat(hotspot.height) / 100 * window.innerHeight;

      // Create rectangle for hotspot
      const rect = new Konva.Rect({
        x: x,
        y: y,
        width: width,
        height: height,
        fill: 'rgba(0, 122, 255, 0.2)',
        stroke: 'rgba(0, 122, 255, 0.8)',
        strokeWidth: 2,
        cornerRadius: 4,
        listening: true,
        draggable: true, // Cho phép kéo rê
      });

      // Lưu id của hotspot vào thuộc tính attrs của rect
      rect.attrs.id = hotspot.id;

      // Add hover effects
      rect.on('mouseenter', () => {
        if (!this.isCreatingHotspot) { // Chỉ áp dụng hover khi không ở chế độ tạo
          rect.fill('rgba(0, 122, 255, 0.4)');
          rect.stroke('rgba(0, 122, 255, 1)');
          if (this.konvaLayer) {
            this.konvaLayer.draw();
          }
          document.body.style.cursor = 'pointer';
        }
      });

      rect.on('mouseleave', () => {
        if (!this.isCreatingHotspot) { // Chỉ áp dụng hover khi không ở chế độ tạo
          rect.fill('rgba(0, 122, 255, 0.2)');
          rect.stroke('rgba(0, 122, 255, 0.8)');
          if (this.konvaLayer) {
            this.konvaLayer.draw();
          }
          document.body.style.cursor = 'default';
        }
      });

      rect.on('click tap', () => {
        if (!this.isCreatingHotspot) { // Nếu không ở chế độ tạo mới xử lý click
          this.onHotspotClick(hotspot);
        } else {
          // Nếu đang ở chế độ tạo, chọn hình chữ nhật này để chỉnh sửa
          this.selectHotspot(rect);
        }
      });

      // Sự kiện để cập nhật hotspot khi kéo rê
      rect.on('dragend', () => {
        this.updateHotspotFromRect(rect);
      });

      // Sự kiện để cập nhật hotspot khi thay đổi kích thước
      rect.on('transformend', () => {
        this.updateHotspotFromRect(rect);
      });

      if (this.konvaLayer) {
        this.konvaLayer.add(rect);
      }
    });

    this.konvaLayer.draw();
  }

  // Screenshot capture functionality
  async captureAndDownloadScreenshot() {
    try {
      await this.screenshotService.captureAndDownloadScreenshot('.screens-content');
      this.workflowService.logWorkflowEvent('screenshot_captured');
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      this.showErrorMessage(this.localizationService.translate('screenshotError'));
    }
  }

  // Swipe navigation for non-scrollable screens
  nextImage() {
    const success = this.screensService.nextScreen();
    if (!success) {
      this.workflowService.logWorkflowEvent('navigation_blocked', { reason: 'next_screen_unavailable' });
    }
  }

  prevImage() {
    const success = this.screensService.previousScreen();
    if (!success) {
      this.workflowService.logWorkflowEvent('navigation_blocked', { reason: 'previous_screen_unavailable' });
    }
  }

  // Toggle hotspot creation mode
  toggleHotspotCreation() {
    this.isCreatingHotspot = !this.isCreatingHotspot;

    if (!this.isCreatingHotspot) {
      // Nếu tắt chế độ tạo, xóa transformer
      if (this.transformer) {
        this.transformer.nodes([]);
      }
    }
  }

  // Handle image loading errors
  onImageError(event: Event) {
    console.error('Image failed to load:', (event.target as HTMLImageElement)?.src);
    this.showErrorMessage(this.localizationService.translate('imageLoadError'));
  }
}
