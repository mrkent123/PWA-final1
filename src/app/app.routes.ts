import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../screens/screens.component').then((m) => m.ScreensComponent),
  },
];
