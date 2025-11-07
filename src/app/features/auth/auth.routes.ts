import { Routes } from '@angular/router';
import { TwoFactorLoginPageComponent } from './two-factor-login/two-factor-login.component'; // New import

export const AUTH_ROUTES: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./new-register/new-register').then(m => m.RegisterComponent)
    },
    {
        path: 'two-factor-login', // New route
        component: TwoFactorLoginPageComponent
    },
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    }
];
