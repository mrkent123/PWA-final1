import { TestBed } from '@angular/core/testing';
import { HotspotService } from './hotspot.service';

describe('HotspotService', () => {
  let service: HotspotService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HotspotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should validate hotspot correctly', () => {
    const validHotspot = {
      id: 'test',
      x: '10%',
      y: '20%',
      width: '30%',
      height: '40%',
      action: 'navigate'
    };

    const invalidHotspot = {
      id: '',
      x: '10%',
      y: '20%',
      width: '30%',
      height: '40%',
      action: 'navigate'
    };

    expect(service.validateHotspot(validHotspot)).toBe(true);
    expect(service.validateHotspot(invalidHotspot)).toBe(false);
  });

  it('should sanitize input correctly', () => {
    expect(service.sanitizeInput('<script>alert("xss")</script>Hello World')).toBe('Hello World');
    expect(service.sanitizeInput('Normal text   with   spaces')).toBe('Normal text with spaces');
  });

  it('should validate credentials', () => {
    const hotspot = {
      id: 'login',
      x: '10%',
      y: '20%',
      width: '30%',
      height: '40%',
      action: 'login',
      credentials: { mst: '123456789', password: 'password123' }
    };

    expect(service.validateCredentials(hotspot, '123456789', 'password123')).toBe(true);
    expect(service.validateCredentials(hotspot, 'wrong', 'password123')).toBe(false);
    expect(service.validateCredentials(hotspot, '123456789', 'wrong')).toBe(false);
  });

  it('should process hotspot actions correctly', () => {
    const inputValues = { mst: '123456789', password: 'password123' };

    const navigateHotspot = {
      id: 'nav',
      x: '10%',
      y: '20%',
      width: '30%',
      height: '40%',
      action: 'navigate',
      target: 'home'
    };

    const inputHotspot = {
      id: 'input',
      x: '10%',
      y: '20%',
      width: '30%',
      height: '40%',
      action: 'input',
      field: 'mst'
    };

    const loginHotspot = {
      id: 'login',
      x: '10%',
      y: '20%',
      width: '30%',
      height: '40%',
      action: 'login',
      credentials: { mst: '123456789', password: 'password123' },
      target: 'home'
    };

    const invalidLoginHotspot = {
      id: 'login',
      x: '10%',
      y: '20%',
      width: '30%',
      height: '40%',
      action: 'login',
      credentials: { mst: '123456789', password: 'password123' }
    };

    expect(service.processHotspotAction(navigateHotspot, inputValues).success).toBe(true);
    expect(service.processHotspotAction(inputHotspot, inputValues).success).toBe(true);
    expect(service.processHotspotAction(loginHotspot, inputValues).success).toBe(true);
    expect(service.processHotspotAction(invalidLoginHotspot, { mst: '', password: '' }).success).toBe(false);
  });
});
