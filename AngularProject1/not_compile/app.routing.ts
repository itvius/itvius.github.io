import {RouterModule, Routes} from '@angular/router';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'main',
        pathMatch: 'full'
    }
];

export const routing = RouterModule.forRoot(routes);
