import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <nav class="top-nav">
      <a routerLink="/" style="font-weight:700; font-size:16px;">🅿️ City Centre Garage</a>
      <div>
        <ng-container *ngIf="!auth.isLoggedIn()">
          <a routerLink="/login">Login</a>
          <a routerLink="/register">Register</a>
        </ng-container>
        <ng-container *ngIf="auth.isLoggedIn()">
          <a routerLink="/dashboard">Dashboard</a>
          <a href="javascript:void(0)" (click)="logout()">Logout</a>
        </ng-container>
      </div>
    </nav>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {
  constructor(public auth: AuthService, private router: Router) {}

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
