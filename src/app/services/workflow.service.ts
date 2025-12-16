import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Workflow {
  initialScreen: string;
  screens: { [screenId: string]: WorkflowStep };
}

export interface WorkflowStep {
  id: string;
  title?: string;
  description?: string;
  nextSteps?: string[];
  previousSteps?: string[];
  requiredInputs?: string[];
  validations?: WorkflowValidation[];
}

export interface WorkflowValidation {
  field: string;
  rule: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private workflowData: Workflow | null = null;
  private currentStepSubject = new BehaviorSubject<string>('');

  public currentStep$ = this.currentStepSubject.asObservable();

  constructor() {}

  async loadWorkflow(): Promise<void> {
    try {
      const workflowRes = await fetch('assets/workflows.json');
      this.workflowData = await workflowRes.json();
      this.currentStepSubject.next(this.workflowData?.initialScreen || 'login');
    } catch (error) {
      console.error('Failed to load workflow data:', error);
      throw new Error('Unable to load workflow configuration');
    }
  }

  getInitialScreen(): string {
    return this.workflowData?.initialScreen || 'login';
  }

  getCurrentStep(): string {
    return this.currentStepSubject.value;
  }

  setCurrentStep(stepId: string): void {
    this.currentStepSubject.next(stepId);
  }

  getStepConfig(stepId: string): WorkflowStep | null {
    return this.workflowData?.screens?.[stepId] || null;
  }

  canNavigateTo(stepId: string): boolean {
    const currentStep = this.getStepConfig(this.getCurrentStep());
    return currentStep?.nextSteps?.includes(stepId) || false;
  }

  canNavigateBack(): boolean {
    const currentStep = this.getStepConfig(this.getCurrentStep());
    return (currentStep?.previousSteps?.length || 0) > 0;
  }

  getNextSteps(): string[] {
    const currentStep = this.getStepConfig(this.getCurrentStep());
    return currentStep?.nextSteps || [];
  }

  getPreviousSteps(): string[] {
    const currentStep = this.getStepConfig(this.getCurrentStep());
    return currentStep?.previousSteps || [];
  }

  validateStepInputs(stepId: string, inputValues: { [key: string]: string }): {
    isValid: boolean;
    errors: string[];
    missingFields: string[];
  } {
    const step = this.getStepConfig(stepId);
    const errors: string[] = [];
    const missingFields: string[] = [];

    if (!step) {
      return { isValid: false, errors: ['Invalid step configuration'], missingFields: [] };
    }

    // Check required inputs
    if (step.requiredInputs) {
      step.requiredInputs.forEach(field => {
        const value = inputValues[field];
        if (!value || value.trim() === '') {
          missingFields.push(field);
        }
      });
    }

    // Check validations
    if (step.validations) {
      step.validations.forEach(validation => {
        const value = inputValues[validation.field];
        if (!this.validateField(validation.rule, value)) {
          errors.push(validation.message);
        }
      });
    }

    return {
      isValid: errors.length === 0 && missingFields.length === 0,
      errors,
      missingFields
    };
  }

  private validateField(rule: string, value: string): boolean {
    if (!value) return false;

    switch (rule) {
      case 'required':
        return value.trim().length > 0;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);

      case 'phone':
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(value);

      case 'number':
        return !isNaN(Number(value));

      case 'minLength:6':
        return value.length >= 6;

      case 'maxLength:50':
        return value.length <= 50;

      default:
        return true;
    }
  }

  logWorkflowEvent(event: string, data?: any): void {
    if (!environment.production) {
      console.log(`[Workflow] ${event}`, data);
    }
    // In production, you might want to send this to a logging service
  }

  resetWorkflow(): void {
    if (this.workflowData) {
      this.setCurrentStep(this.workflowData.initialScreen);
    }
  }
}

// Import environment for production checks
import { environment } from '../../environments/environment';
