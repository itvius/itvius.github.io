import { NoPreloading, RouterModule, Routes } from '@angular/router';
import {MainComponent} from './main/main.component';
import {ContentComponent} from './main/content/content.component';

const routes: Routes = [
  { path: '', redirectTo: 'main', pathMatch: 'full' },
  {
    path: 'main',
    component: MainComponent,
    children: [
      {
        path: '',
        redirectTo: 'main-content',
        pathMatch: 'full'
      },
      {
        path: 'main-content',
        component: ContentComponent
      }
    ]
  },
];

export const routing = RouterModule.forRoot(routes, {
  preloadingStrategy: NoPreloading,
  useHash: true,
  enableTracing: false,
  onSameUrlNavigation: 'reload'
});
