import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Language = 'vi' | 'en';

export interface LocalizationStrings {
  // Common
  loading: string;
  error: string;
  success: string;
  close: string;

  // Screens
  loadingScreen: string;
  screenAlt: string;
  headerAlt: string;
  contentAlt: string;

  // Hotspots
  hotspotRegionLabel: string;
  inputFieldDescription: string;
  navigateAction: string;
  loginAction: string;
  unknownAction: string;
  emptyValue: string;

  // Keyboard
  doneButton: string;
  placeholder: string;

  // Messages
  loginSuccess: string;
  loginError: string;
  inputRequired: string;
  navigationError: string;
  imageLoadError: string;
  screenshotError: string;
  dataLoadError: string;

  // Fields
  taxCode: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocalizationService {
  private currentLanguageSubject = new BehaviorSubject<Language>('vi');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  private strings: Record<Language, LocalizationStrings> = {
    vi: {
      // Common
      loading: 'Đang tải...',
      error: 'Lỗi',
      success: 'Thành công',
      close: 'Đóng',

      // Screens
      loadingScreen: 'Đang tải màn hình...',
      screenAlt: 'Màn hình',
      headerAlt: 'Header màn hình',
      contentAlt: 'Nội dung màn hình',

      // Hotspots
      hotspotRegionLabel: 'Vùng tương tác hotspot',
      inputFieldDescription: 'Trường nhập',
      navigateAction: 'Điều hướng đến',
      loginAction: 'Nút đăng nhập',
      unknownAction: 'Hành động',
      emptyValue: 'trống',

      // Keyboard
      doneButton: 'Xong',
      placeholder: 'Nhập giá trị',

      // Messages
      loginSuccess: 'Đăng nhập thành công!',
      loginError: 'Mã số thuế hoặc mật khẩu không đúng',
      inputRequired: 'Vui lòng nhập đầy đủ thông tin',
      navigationError: 'Không thể chuyển đến màn hình được yêu cầu',
      imageLoadError: 'Không thể tải hình ảnh màn hình',
      screenshotError: 'Không thể chụp màn hình',
      dataLoadError: 'Không thể tải dữ liệu màn hình',

      // Fields
      taxCode: 'Mã số thuế',
      password: 'Mật khẩu'
    },
    en: {
      // Common
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      close: 'Close',

      // Screens
      loadingScreen: 'Loading screen...',
      screenAlt: 'Screen',
      headerAlt: 'Screen header',
      contentAlt: 'Screen content',

      // Hotspots
      hotspotRegionLabel: 'Hotspot interaction region',
      inputFieldDescription: 'Input field',
      navigateAction: 'Navigate to',
      loginAction: 'Login button',
      unknownAction: 'Action',
      emptyValue: 'empty',

      // Keyboard
      doneButton: 'Done',
      placeholder: 'Enter value',

      // Messages
      loginSuccess: 'Login successful!',
      loginError: 'Invalid tax code or password',
      inputRequired: 'Please fill in all required fields',
      navigationError: 'Cannot navigate to requested screen',
      imageLoadError: 'Cannot load screen image',
      screenshotError: 'Cannot capture screenshot',
      dataLoadError: 'Cannot load screen data',

      // Fields
      taxCode: 'Tax Code',
      password: 'Password'
    }
  };

  constructor() {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('app-language') as Language;
    if (savedLanguage && this.strings[savedLanguage]) {
      this.setLanguage(savedLanguage);
    }
  }

  getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  setLanguage(language: Language): void {
    if (this.strings[language]) {
      this.currentLanguageSubject.next(language);
      localStorage.setItem('app-language', language);

      // Update document language attribute
      document.documentElement.lang = language;

      console.log(`Language changed to: ${language}`);
    }
  }

  getStrings(): LocalizationStrings {
    return this.strings[this.getCurrentLanguage()];
  }

  translate(key: keyof LocalizationStrings, ...args: any[]): string {
    const strings = this.getStrings();
    let translation = strings[key];

    // Replace placeholders like {0}, {1}, etc.
    args.forEach((arg, index) => {
      translation = translation.replace(new RegExp(`\\{${index}\\}`, 'g'), arg.toString());
    });

    return translation;
  }

  // Convenience methods for common translations
  getScreenAlt(screenId: string): string {
    return `${this.translate('screenAlt')} ${screenId}`;
  }

  getHeaderAlt(screenId: string): string {
    return `${this.translate('headerAlt')} ${screenId}`;
  }

  getContentAlt(screenId: string, part?: number): string {
    const base = `${this.translate('contentAlt')} ${screenId}`;
    return part ? `${base} phần ${part}` : base;
  }

  getHotspotDescription(hotspot: any, inputValues: { [key: string]: string } = {}): string {
    switch (hotspot.action) {
      case 'input':
        const currentValue = inputValues[hotspot.field || ''] || this.translate('emptyValue');
        return `${this.translate('inputFieldDescription')} ${hotspot.field} - giá trị hiện tại: ${currentValue}`;
      case 'navigate':
        return `${this.translate('navigateAction')} ${hotspot.target}`;
      case 'login':
        return this.translate('loginAction');
      default:
        return `${this.translate('unknownAction')} ${hotspot.action}`;
    }
  }

  // Error message helpers
  getErrorMessage(key: keyof LocalizationStrings): string {
    return this.translate(key);
  }

  getSuccessMessage(key: keyof LocalizationStrings): string {
    return this.translate(key);
  }
}
