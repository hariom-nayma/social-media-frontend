import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginSessionsComponent } from '../login-sessions/login-sessions';

@Component({
  selector: 'app-security-settings',
  standalone: true,
  imports: [CommonModule, LoginSessionsComponent],
  templateUrl: './security-settings.html',
  styleUrls: ['./security-settings.css']
})
export class SecuritySettingsComponent {

}
