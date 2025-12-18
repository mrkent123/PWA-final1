# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-12-18

### 🎉 **Production-Ready Release**

#### Added
- **Component Architecture Overhaul**
  - `ScreenViewerComponent`: Dedicated screen display component with accessibility features
  - `HotspotOverlayComponent`: Interactive hotspot overlay with full keyboard navigation
  - `ErrorBoundaryComponent`: Global error handling with user-friendly messages
  - Refactored monolithic `ScreensComponent` from 400+ lines to ~200 lines

- **Internationalization (i18n)**
  - Complete Vietnamese/English localization service
  - Persistent language preferences with localStorage
  - Extensible architecture for additional languages
  - Replaced all hard-coded Vietnamese strings

- **Accessibility (WCAG 2.1 AA Compliant)**
  - Full keyboard navigation (Arrow keys, Enter, Space, Tab)
  - Screen reader support with ARIA labels and live regions
  - High contrast mode support
  - Reduced motion preferences respected
  - Focus management and visual indicators
  - JAWS, NVDA, and VoiceOver compatibility

- **Error Handling & Resilience**
  - Global error boundaries with intelligent error classification
  - User-friendly error messages based on error types
  - Graceful degradation for better user experience
  - Network, timeout, and permission error handling

- **Documentation**
  - Comprehensive README with production deployment guides
  - Installation and setup instructions
  - Accessibility compliance documentation
  - Performance metrics and architecture overview

#### Changed
- **Architecture**: Complete component separation of concerns
- **Localization**: All user-facing strings now translatable
- **Error Messages**: Context-aware error messages in Vietnamese
- **Build Process**: Optimized for production deployment

#### Fixed
- **Accessibility**: Missing ARIA labels and keyboard navigation
- **Localization**: Hard-coded Vietnamese strings throughout codebase
- **Component Complexity**: Monolithic component with mixed responsibilities
- **Error Handling**: No global error boundaries

#### Performance
- **Bundle Size**: Optimized to 71.56 kB (excluding dev transforms)
- **Lazy Loading**: Component-level lazy loading implemented
- **Tree Shaking**: Dead code elimination working correctly
- **PWA**: Service worker and offline capabilities maintained

#### Testing
- **E2E Tests**: Keyboard interactions and accessibility features tested
- **Component Integration**: New components verified through existing test suite
- **Build Process**: Production build verified and working

## [1.0.0] - 2025-12-15

### Added
- Initial release of Mobile App Simulator
- Screenshot to PWA conversion system
- iOS keyboard component with virtual keyboard
- Hotspot interaction system
- Canvas overlay with Konva.js
- Screenshot capture functionality
- PWA deployment capabilities
- Mobile app frame simulation
- Workflow management system

### Features
- Automatic image processing and standardization
- Interactive hotspot creation and editing
- Multi-screen navigation
- Keyboard input simulation
- Screenshot export functionality
- Responsive design for mobile and desktop

### Technical
- Angular 20 with Ionic 8
- Capacitor for mobile deployment
- Konva.js for canvas interactions
- Service worker for PWA
- Cypress for E2E testing
- TypeScript with strict mode
