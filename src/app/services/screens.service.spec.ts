import { TestBed } from '@angular/core/testing';
import { ScreensService } from './screens.service';

describe('ScreensService', () => {
  let service: ScreensService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScreensService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty screens', () => {
    expect(service.getScreens()).toEqual([]);
    expect(service.getCurrentScreen()).toBeNull();
  });

  it('should navigate between screens', () => {
    const mockScreens = [
      { id: 'screen1', src: 'img1.jpg', type: 'static' },
      { id: 'screen2', src: 'img2.jpg', type: 'static' }
    ];

    // Mock the service's internal state
    (service as any).screens = mockScreens;

    expect(service.navigateToScreen('screen2')).toBe(true);
    expect(service.getCurrentIndex()).toBe(1);

    expect(service.navigateToScreen('nonexistent')).toBe(false);
  });

  it('should handle scrollable screen detection', () => {
    const mockScrollableScreen = { id: 'scroll', src: 'scroll.jpg', type: 'scrollable' };
    const mockStaticScreen = { id: 'static', src: 'static.jpg', type: 'static' };

    (service as any).screens = [mockStaticScreen, mockScrollableScreen];

    service.setCurrentIndex(0);
    expect(service.isScrollableScreen).toBe(false);

    service.setCurrentIndex(1);
    expect(service.isScrollableScreen).toBe(true);
  });
});
