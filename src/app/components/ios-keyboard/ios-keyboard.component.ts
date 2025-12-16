import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import Keyboard from 'simple-keyboard';
import { IosKeyboardService, KeyboardState } from './ios-keyboard.service';

@Component({
  selector: 'app-ios-keyboard',
  templateUrl: './ios-keyboard.component.html',
  styleUrls: ['./ios-keyboard.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class IosKeyboardComponent implements OnInit, OnDestroy {
  @ViewChild('keyboardContainer', { static: true }) keyboardContainer!: ElementRef;

  @Output() valueChange = new EventEmitter<{ field: string; value: string }>();
  @Output() keyboardClose = new EventEmitter<void>();

  keyboard!: Keyboard;
  currentState: KeyboardState = {
    isVisible: false,
    activeField: null,
    inputType: 'text',
    currentValue: '',
    placeholder: ''
  };

  private subscription!: Subscription;

  // iOS Number Pad Layout
  private numberPadLayout = {
    default: [
      "1 2 3 4 5",
      "6 7 8 9 0",
      "{bksp} {done}"
    ]
  };

  // iOS Text Keyboard Layout (QWERTY)
  private textLayout = {
    default: [
      "q w e r t y u i o p",
      "a s d f g h j k l",
      "{shift} z x c v b n m {bksp}",
      "{numbers} {space} {done}"
    ],
    shift: [
      "Q W E R T Y U I O P",
      "A S D F G H J K L",
      "{shift} Z X C V B N M {bksp}",
      "{numbers} {space} {done}"
    ],
    numbers: [
      "1 2 3 4 5 6 7 8 9 0",
      "- / : ; ( ) $ & @ \"",
      "{abc} . , ? ! ' {bksp}",
      "{numbers} {space} {done}"
    ]
  };

  constructor(private keyboardService: IosKeyboardService) {}

  ngOnInit() {
    this.subscription = this.keyboardService.keyboardState.subscribe(state => {
      this.currentState = state;
      this.handleStateChange(state);
    });

    this.initializeKeyboard();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.keyboard) {
      this.keyboard.destroy();
    }
  }

  private initializeKeyboard() {
    console.log('Initializing iOS Keyboard with state:', this.currentState);

    this.keyboard = new Keyboard({
      onChange: input => this.onChange(input),
      onKeyPress: button => this.onKeyPress(button),
      theme: "hg-theme-default hg-theme-ios",
      layout: this.currentState.inputType === 'number' ? this.numberPadLayout : this.textLayout,
      display: this.getDisplayConfig(),
      buttonTheme: this.getButtonThemeConfig(),
      mergeDisplay: true,
      physicalKeyboardHighlight: false,
      preventMouseDownDefault: false, // Allow mouse events for desktop testing
      debug: true // Enable debug for troubleshooting
    });

    console.log('Keyboard initialized:', this.keyboard);
  }

  private handleStateChange(state: KeyboardState) {
    if (state.isVisible) {
      // Update keyboard layout based on input type
      const layout = state.inputType === 'number' ? this.numberPadLayout : this.textLayout;
      this.keyboard.setOptions({
        layout: layout,
        display: this.getDisplayConfig()
      });

      // Set current value
      this.keyboard.setInput(state.currentValue);
    }
  }

  private getDisplayConfig(): { [button: string]: string } {
    const baseConfig = {
      '{bksp}': '⌫',
      '{done}': 'Xong'
    };

    if (this.currentState.inputType === 'number') {
      return baseConfig;
    } else {
      return {
        ...baseConfig,
        '{shift}': '⇧',
        '{numbers}': '123',
        '{abc}': 'ABC',
        '{space}': 'space',
        '{done}': 'Done'
      };
    }
  }

  private getButtonThemeConfig() {
    return [
      {
        class: "hg-button-special",
        buttons: "{shift} {numbers} {abc} {done}"
      },
      {
        class: "hg-button-wide",
        buttons: "{space}"
      }
    ];
  }

  onChange(input: string) {
    this.keyboardService.updateValue(input);
    if (this.currentState.activeField) {
      this.valueChange.emit({
        field: this.currentState.activeField,
        value: input
      });
    }
  }

  onKeyPress(button: string) {
    // Handle special keys
    if (button === '{shift}') {
      this.handleShift();
    } else if (button === '{done}') {
      this.handleDone();
    } else if (button === '{numbers}') {
      this.keyboard.setOptions({ layoutName: 'numbers' });
    } else if (button === '{abc}') {
      this.keyboard.setOptions({ layoutName: 'default' });
    }
  }

  private handleShift() {
    const currentLayout = this.keyboard.options.layoutName;
    const shiftToggle = currentLayout === "default" ? "shift" : "default";

    this.keyboard.setOptions({
      layoutName: shiftToggle
    });
  }

  private handleDone() {
    this.keyboardService.hideKeyboard();
    this.keyboardClose.emit();
  }

  // Public method to programmatically hide keyboard
  hide() {
    this.keyboardService.hideKeyboard();
  }
}
