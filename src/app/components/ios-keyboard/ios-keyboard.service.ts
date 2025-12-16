import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import keyboardjs from 'keyboardjs';

export interface KeyboardState {
  isVisible: boolean;
  activeField: string | null;
  inputType: 'number' | 'text' | 'password';
  currentValue: string;
  placeholder: string;
}

@Injectable({
  providedIn: 'root'
})
export class IosKeyboardService {
  private keyboardState$ = new BehaviorSubject<KeyboardState>({
    isVisible: false,
    activeField: null,
    inputType: 'text',
    currentValue: '',
    placeholder: ''
  });

  public keyboardState = this.keyboardState$.asObservable();

  constructor() {
    this.initializeKeyboardJS();
  }

  private initializeKeyboardJS() {
    // Bind physical keyboard events to virtual keyboard
    keyboardjs.bind('enter', () => {
      if (this.keyboardState$.value.isVisible) {
        this.hideKeyboard();
      }
    });

    keyboardjs.bind('escape', () => {
      if (this.keyboardState$.value.isVisible) {
        this.hideKeyboard();
      }
    });

    // Handle backspace
    keyboardjs.bind('backspace', () => {
      if (this.keyboardState$.value.isVisible) {
        const currentValue = this.keyboardState$.value.currentValue;
        if (currentValue.length > 0) {
          this.updateValue(currentValue.slice(0, -1));
        }
      }
    });

    // Handle alphanumeric input
    keyboardjs.bind(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
                     'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
                     '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'space'], (e) => {
      if (this.keyboardState$.value.isVisible && e) {
        const key = e.key === 'space' ? ' ' : e.key;
        const currentValue = this.keyboardState$.value.currentValue;
        this.updateValue(currentValue + key);
      }
    });
  }

  showKeyboard(field: string, inputType: 'number' | 'text' | 'password', currentValue: string, placeholder: string = '') {
    this.keyboardState$.next({
      isVisible: true,
      activeField: field,
      inputType,
      currentValue,
      placeholder
    });
  }

  hideKeyboard() {
    this.keyboardState$.next({
      ...this.keyboardState$.value,
      isVisible: false
    });
  }

  updateValue(newValue: string) {
    this.keyboardState$.next({
      ...this.keyboardState$.value,
      currentValue: newValue
    });
  }

  getCurrentState(): KeyboardState {
    return this.keyboardState$.value;
  }
}
