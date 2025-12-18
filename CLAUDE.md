# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm start              # Start dev server (ng serve)
npm run build          # Production build (output: www/browser/)
npm run serve:external # Serve with external network access (http://[IP]:8102)
npm run lint           # Run ESLint
npm test               # Run Karma tests
```

### Image Processing Automation
```bash
python scripts/process_images.py  # Process all images, normalize filenames, group by content, remove signal bars
```

### Mobile Deployment
```bash
npm run cap:add:android   # Add Android platform
npm run cap:run:android   # Run on Android device
npm run cap:add:ios       # Add iOS platform
npm run cap:run:ios       # Run on iOS device
```

## Architecture

This is an **Automated Screenshot-to-PWA Prototype Framework** built with Angular 20 + Ionic 8. It transforms screenshot images into interactive native-like prototypes without coding UI components, with full automation for image processing.

### Core Concept
- Screenshots serve as the UI (stored in `src/assets/screens/` with any naming convention)
- Clickable regions (hotspots) are defined via JSON, using percentage-based positioning for responsiveness
- Navigation flows are configured through JSON files, not code
- Full automation for image processing: filename normalization, content-based grouping, signal bar removal

### Key Configuration Files
- `src/assets/screens.json` - List of screen images with IDs (auto-generated from images)
- `hotspot.json` - Clickable region definitions (x, y, width, height in %) with actions
- `workflows.json` - Navigation logic, initial screen, and mock data per screen

### Main Component
`src/screens/screens.component.ts` - The single page component that:
- Loads screen images from `screens.json`
- Renders hotspots as overlay divs
- Handles navigation between screens via hotspot clicks
- Supports swipe gestures for sequential navigation

### Automated Image Processing ✅ IMPLEMENTED
The `scripts/process_images.py` script provides complete automation for:
- ✅ Filename normalization (removes special characters, numbers, hashes)
- ✅ Content-based image grouping using HSV histogram similarity (determines scrollable vs static screens)
- ✅ Signal bar removal (automatically detects and removes status bar areas)
- ✅ Auto-generation of screens.json from images in directory
- ✅ Backup creation to preserve original files
- ✅ Full pipeline: backup → normalize → clean → group → generate config

### Hotspot Creation
Hotspots are created directly within the application using a drag-and-drop interface. The application automatically detects image dimensions to determine scrollable vs static screens.

## Deployment

### Vercel
- Configured via `vercel.json`
- **Output directory**: `www/browser` (Angular 17+ application builder outputs to subdirectory)
- Uses `rewrites` (not `routes`) for SPA routing - `routes` conflicts with `headers`

### PWA / Service Worker
- Service worker config: `ngsw-config.json`
- In `angular.json` production config: `"serviceWorker": "ngsw-config.json"` (string path, NOT boolean)
- Package: `@angular/service-worker` required in dependencies

## Important Notes

- **Angular 17+ application builder**: Output goes to `www/browser/`, not `www/`
- **serviceWorker in angular.json**: Must be string path (e.g., `"ngsw-config.json"`) or omitted entirely - boolean values cause schema validation errors
- **vercel.json**: Cannot mix `routes` with `headers`/`rewrites` - use new syntax (`rewrites`, `headers`) not old (`routes`, `builds`)
- Hotspot coordinates use percentages (e.g., `"x": "10%"`) for responsive positioning
- Screen IDs in `screens.json` must match keys in `hotspot.json` and `workflows.json`
- Use `python scripts/process_images.py` to automate all image processing and configuration
