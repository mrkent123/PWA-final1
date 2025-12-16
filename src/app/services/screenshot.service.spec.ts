import { TestBed } from '@angular/core/testing';
import { ScreenshotService } from './screenshot.service';

describe('ScreenshotService', () => {
  let service: ScreenshotService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScreenshotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with correct default state', () => {
    expect(service.isCapturing).toBe(false);
    expect(service.getRemainingDebounceTime()).toBe(0);
  });

  it('should handle debounce correctly', async () => {
    const startTime = Date.now();

    // First call should work
    const promise1 = service.captureAndDownloadScreenshot('.test-element');
    expect(service.isCapturing).toBe(true);

    // Immediate second call should be debounced
    const promise2 = service.captureAndDownloadScreenshot('.test-element');

    // Wait for debounce timeout
    await new Promise(resolve => setTimeout(resolve, 600));

    expect(service.getRemainingDebounceTime()).toBe(0);
  });

  it('should prevent concurrent captures', async () => {
    // Mock a long-running capture
    spyOn(service as any, 'captureWithHtml2Canvas').and.returnValue(new Promise(resolve => setTimeout(resolve, 100)));

    const promise1 = service.captureAndDownloadScreenshot('.test-element');
    expect(service.isCapturing).toBe(true);

    // Second call should be rejected
    try {
      await service.captureAndDownloadScreenshot('.test-element');
      fail('Should have thrown an error for concurrent capture');
    } catch (error) {
      expect(error).toBeDefined();
    }

    // Wait for first capture to complete
    await promise1;
    expect(service.isCapturing).toBe(false);
  });

  it('should handle element not found error', async () => {
    try {
      await service.captureAndDownloadScreenshot('.nonexistent-element');
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).toContain('Screenshot target element not found');
    }
  });

  it('should reset capturing state on error', async () => {
    try {
      await service.captureAndDownloadScreenshot('.nonexistent-element');
    } catch (error) {
      // Expected error
    }

    expect(service.isCapturing).toBe(false);
  });
});
