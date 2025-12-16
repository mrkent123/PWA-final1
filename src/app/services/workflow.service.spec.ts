import { TestBed } from '@angular/core/testing';
import { WorkflowService } from './workflow.service';

describe('WorkflowService', () => {
  let service: WorkflowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkflowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(service.getCurrentStep()).toBe('');
    expect(service.getInitialScreen()).toBe('login');
  });

  it('should validate step inputs correctly', () => {
    const mockWorkflow = {
      initialScreen: 'login',
      screens: {
        login: {
          id: 'login',
          title: 'Login Screen',
          requiredInputs: ['username', 'password'],
          validations: [
            { field: 'username', rule: 'required', message: 'Username is required' },
            { field: 'password', rule: 'minLength:6', message: 'Password must be at least 6 characters' }
          ]
        }
      }
    };

    (service as any).workflowData = mockWorkflow;

    const validInputs = { username: 'testuser', password: 'password123' };
    const invalidInputs = { username: '', password: '123' };

    expect(service.validateStepInputs('login', validInputs).isValid).toBe(true);
    expect(service.validateStepInputs('login', invalidInputs).isValid).toBe(false);
    expect(service.validateStepInputs('nonexistent', validInputs).isValid).toBe(false);
  });

  it('should validate individual fields correctly', () => {
    expect((service as any).validateField('required', 'test')).toBe(true);
    expect((service as any).validateField('required', '')).toBe(false);
    expect((service as any).validateField('email', 'test@example.com')).toBe(true);
    expect((service as any).validateField('email', 'invalid')).toBe(false);
    expect((service as any).validateField('minLength:6', '123456')).toBe(true);
    expect((service as any).validateField('minLength:6', '123')).toBe(false);
    expect((service as any).validateField('unknown', 'test')).toBe(true);
  });

  it('should manage workflow navigation', () => {
    const mockWorkflow = {
      initialScreen: 'login',
      screens: {
        login: {
          id: 'login',
          nextSteps: ['home']
        },
        home: {
          id: 'home',
          previousSteps: ['login']
        }
      }
    };

    (service as any).workflowData = mockWorkflow;
    service.setCurrentStep('login');

    expect(service.canNavigateTo('home')).toBe(true);
    expect(service.canNavigateTo('profile')).toBe(false);
    expect(service.canNavigateBack()).toBe(false);
    expect(service.getNextSteps()).toEqual(['home']);
  });

  it('should reset workflow correctly', () => {
    const mockWorkflow = {
      initialScreen: 'login',
      screens: {}
    };

    (service as any).workflowData = mockWorkflow;
    service.setCurrentStep('home');

    service.resetWorkflow();
    expect(service.getCurrentStep()).toBe('login');
  });
});
