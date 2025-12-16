# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm start              # Start dev server (ng serve)
npm run build          # Production build (output: www/)
npm run serve:external # Serve with external network access (http://[IP]:8102)
npm run lint           # Run ESLint
npm test               # Run Karma tests
```

### Hotspot Processing (ImageJ Integration)
```bash
npm run watch:hotspots    # Auto-sync hotspots from ImageJ exports
npm run process:hotspots  # Manual hotspot processing
```

### Mobile Deployment
```bash
npm run cap:add:android   # Add Android platform
npm run cap:run:android   # Run on Android device
npm run cap:add:ios       # Add iOS platform
npm run cap:run:ios       # Run on iOS device
```

## Architecture

This is a **Screenshot-to-PWA Prototype Framework** built with Angular 20 + Ionic 8. It transforms screenshot images into interactive prototypes without coding UI components.

### Core Concept
- Screenshots serve as the UI (stored in `src/assets/screens/`)
- Clickable regions (hotspots) are defined via JSON, using percentage-based positioning for responsiveness
- Navigation flows are configured through JSON files, not code

### Key Configuration Files
- `src/assets/screens.json` - List of screen images with IDs
- `hotspot.json` - Clickable region definitions (x, y, width, height in %) with actions
- `workflows.json` - Navigation logic, initial screen, and mock data per screen

### Main Component
`src/screens/screens.component.ts` - The single page component that:
- Loads screen images from `screens.json`
- Renders hotspots as overlay divs
- Handles navigation between screens via hotspot clicks
- Supports swipe gestures for sequential navigation

### ImageJ Integration
The `imagej-macros/hotspot-exporter.ijm` macro allows drawing hotspot regions visually in ImageJ/Fiji. The `scripts/watch-hotspots.js` watcher auto-merges exported coordinates into `hotspot.json`.

## Deployment

- **Vercel**: Configured via `vercel.json`, outputs to `www/` directory
- **PWA**: Build with `npm run build` for installable web app
- Uses `@angular-devkit/build-angular:application` builder (Angular 17+ style)

## Important Notes

- Do NOT add `serviceWorker` boolean to `angular.json` - the application builder only accepts string paths or omission
- Hotspot coordinates use percentages (e.g., `"x": "10%"`) for responsive positioning
- Screen IDs in `screens.json` must match keys in `hotspot.json` and `workflows.json`
