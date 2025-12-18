import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocalizationService } from '../../services/localization.service';

@Component({
  selector: 'app-error-boundary',
  templateUrl: './error-boundary.component.html',
  styleUrls: ['./error-boundary.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ErrorBoundaryComponent {
  @Input() error: Error | null = null;
  @Input() showDetails = false;
  @Output() retry = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();

  constructor(private localization: LocalizationService) {}

  get errorTitle(): string {
    return this.localization.translate('error');
  }

  get errorMessage(): string {
    if (this.error?.message) {
      return this.error.message;
    }
    return this.localization.translate('dataLoadError');
  }

  get retryButtonText(): string {
    return 'Thử lại'; // Keep in Vietnamese as it's a UI action
  }

  get dismissButtonText(): string {
    return this.localization.translate('close');
  }

  get showDetailsText(): string {
    return this.showDetails ? 'Ẩn chi tiết' : 'Hiển thị chi tiết';
  }

  onRetry(): void {
    this.retry.emit();
  }

  onDismiss(): void {
    this.dismiss.emit();
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  // Get user-friendly error messages based on error type
  getUserFriendlyMessage(): string {
    if (!this.error) return this.localization.translate('dataLoadError');

    const message = this.error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'Không thể kết nối mạng. Vui lòng kiểm tra kết nối internet.';
    }

    if (message.includes('timeout')) {
      return 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.';
    }

    if (message.includes('permission') || message.includes('access')) {
      return 'Không có quyền truy cập. Vui lòng kiểm tra quyền của ứng dụng.';
    }

    if (message.includes('not found') || message.includes('404')) {
      return 'Không tìm thấy tài nguyên được yêu cầu.';
    }

    return this.errorMessage;
  }
}
