import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AUTH_ROUTES } from './features/auth/auth.routes';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./shared/components/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./features/feed/home/home.component').then(m => m.HomeComponent)
            },
            {
                path: 'profile/:username',
                loadComponent: () => import('./features/profile/view-profile/view-profile.component').then(m => m.ViewProfileComponent)
            },
            {
                path: 'profile',
                loadComponent: () => import('./features/profile/view-profile/view-profile.component').then(m => m.ViewProfileComponent)
            },
            {
                path: 'update-profile',
                loadComponent: () => import('./features/profile/update-profile/update-profile.component').then(m => m.UpdateProfileComponent)
            },
            {
                path: 'pending-requests',
                loadComponent: () => import('./features/feed/pending-requests/pending-requests.component').then(m => m.PendingRequestsComponent)
            },
            {
                path: 'notifications',
                loadComponent: () => import('./features/notification/notification.component').then(m => m.NotificationComponent)
            },
            {
                path: 'chat/user/:username',
                loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent)
            },
            {
                path: 'chat/:conversationId',
                loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent)
            },
            {
                path: 'conversations',
                loadComponent: () => import('./features/chat/conversations/conversations.component').then(m => m.ConversationsComponent)
            },
            {
                path: 'reels',
                loadComponent: () => import('./features/reels/reels-list/reels-list.component').then(m => m.ReelsListComponent)
            }
          ]
    },
    {
        path: 'auth',
        children: AUTH_ROUTES
    },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    }
];
