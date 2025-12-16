import { Component, ViewChild, ElementRef, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { IosKeyboardComponent } from '../app/components/ios-keyboard/ios-keyboard.component';
import { IosKeyboardService } from '../app/components/ios-keyboard/ios-keyboard.service';
import { ScreensService, Screen } from '../app/services/screens.service';
import { HotspotService, Hotspot } from '../app/services/hotspot.service';
import { WorkflowService } from '../app/services/workflow.service';
import { ScreenshotService } from '../app/services/screenshot.service';
import Konva from 'konva';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-screens',
  templateUrl: './screens.component.html',
  styleUrls: ['./screens.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IosKeyboardComponent],
})
export class ScreensComponent implements OnInit, AfterViewInit, OnDestroy {
  private konvaStage: Konva.Stage | null = null;
  private konvaLayer: Konva.Layer | null = null;
  private subscriptions: Subscription = new Subscription();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  @ViewChild('konvaContainer', { static: false }) konvaContainer!: ElementRef;
  @ViewChild(IosKeyboardComponent) iosKeyboard!: IosKeyboardComponent;

  // Reactive data from services
  currentScreen$ = this.screensService.screens$;
  currentIndex$ = this.screensService.currentIndex$;
  currentHotspots$ = this.hotspotService.currentHotspots$;
  isCapturing$ = this.screenshotService.isCapturing$;

  // Input values - bound directly via ngModel
  inputValues: { [key: string]: string } = {
    mst: '',
    password: ''
  };

  // UI state
  showError = false;
  errorMessage = '';
  showSuccess = false;

  constructor(
    private keyboardService: IosKeyboardService,
    private screensService: ScreensService,
    private hotspotService: HotspotService,
    private workflowService: WorkflowService,
    private screenshotService: ScreenshotService
  ) {}

  async ngOnInit() {
    try {
      // Initialize all services
      await Promise.all([
        this.screensService.loadScreens(),
        this.hotspotService.loadHotspotData(),
        this.workflowService.loadWorkflow()
      ]);

      // Subscribe to screen changes to update hotspots
      this.subscriptions.add(
        this.currentIndex$.subscribe(index => {
          const currentScreen = this.screensService.getCurrentScreen();
          if (currentScreen) {
            this.hotspotService.setCurrentScreen(currentScreen.id);
            this.workflowService.setCurrentStep(currentScreen.id);
            this.drawKonvaHotspots();
          }
        })
      );

      this.workflowService.logWorkflowEvent('screens_initialized');
    } catch (error) {
      console.error('Failed to initialize screens component:', error);
      this.showErrorMessage('Không thể tải dữ liệu màn hình');
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
    return this.screensService.getCurrentScreen();
  }

  get isScrollableScreen(): boolean {
    return this.screensService.isScrollableScreen;
  }

  navigateToScreen(screenId: string) {
    const success = this.screensService.navigateToScreen(screenId);
    if (success) {
      this.workflowService.logWorkflowEvent('screen_navigated', { from: this.workflowService.getCurrentStep(), to: screenId });
    } else {
      this.showErrorMessage('Không thể chuyển đến màn hình được yêu cầu');
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
      this.errorMessage = 'Vui lòng nhập đầy đủ thông tin';
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
      this.errorMessage = 'Mã số thuế hoặc mật khẩu không đúng';
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
  }

  private drawKonvaHotspots() {
    if (!this.konvaLayer) return;

    // Clear existing hotspots
    this.konvaLayer.destroyChildren();

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
      });

      // Add hover effects
      rect.on('mouseenter', () => {
        rect.fill('rgba(0, 122, 255, 0.4)');
        rect.stroke('rgba(0, 122, 255, 1)');
        if (this.konvaLayer) {
          this.konvaLayer.draw();
        }
        document.body.style.cursor = 'pointer';
      });

      rect.on('mouseleave', () => {
        rect.fill('rgba(0, 122, 255, 0.2)');
        rect.stroke('rgba(0, 122, 255, 0.8)');
        if (this.konvaLayer) {
          this.konvaLayer.draw();
        }
        document.body.style.cursor = 'default';
      });

      rect.on('click tap', () => {
        this.onHotspotClick(hotspot);
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
      this.showErrorMessage('Không thể chụp màn hình');
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
}
