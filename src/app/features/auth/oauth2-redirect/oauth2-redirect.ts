import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-oauth2-redirect',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './oauth2-redirect.html',
  styleUrls: ['./oauth2-redirect.css']
})
export class Oauth2RedirectComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const accessToken = params['accessToken'];
      const refreshToken = params['refreshToken'];

      if (accessToken && refreshToken) {
        this.authService.oauth2Login(accessToken, refreshToken);
        this.router.navigate(['/home']);
      } else {
        // Handle error or redirect to login if tokens are missing
        this.router.navigate(['/auth/login'], { queryParams: { error: 'oauth2_login_failed' } });
      }
    });
  }
}