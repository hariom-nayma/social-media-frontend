import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { Oauth2RedirectComponent } from './features/auth/oauth2-redirect/oauth2-redirect'; // Import the new component

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
            },
            {
                path: 'stream-call-list',
                loadComponent: () => import('./features/stream-call/stream-call-list/stream-call-list.component').then(m => m.StreamCallListComponent)
            },
            {
                path: 'stream-call/:callId',
                loadComponent: () => import('./features/stream-call/stream-call/stream-call.component').then(m => m.StreamCallComponent)
            },
            {
                path: 'payment-success',
                loadComponent: () => import('./features/payment/payment-success.component').then(m => m.PaymentSuccessComponent)
            },
            {
                path: 'payment-cancelled',
                loadComponent: () => import('./features/payment/payment-cancelled.component').then(m => m.PaymentCancelledComponent)
            },
            {
                path: 'call-screen',
                loadComponent: () => import('./features/call-screen/call-screen.component').then(m => m.CallScreenComponent)
            }
          ]
    },
    {
        path: 'auth',
        children: AUTH_ROUTES
    },
    {
        path: 'oauth2/redirect', // New route for OAuth2 redirect
        component: Oauth2RedirectComponent
    },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    }
];
