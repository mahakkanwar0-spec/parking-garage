import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container" style="max-width:400px;">
      <div class="card">
        <h2>Attendant Login</h2>
        <form (ngSubmit)="submit()" style="display:flex; flex-direction:column; gap:12px;">
          <input type="text" placeholder="Username" [(ngModel)]="username" name="username" required>
          <input type="password" placeholder="Password" [(ngModel)]="password" name="password" required>
          <button class="btn" type="submit" [disabled]="loading">{{ loading ? 'Logging in...' : 'Login' }}</button>
        </form>
        <p *ngIf="error" class="error">{{ error }}</p>
        <p style="margin-top:14px; font-size:14px;">No account? <a routerLink="/register">Register here</a></p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.error = '';
    this.loading = true;
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail || 'Login failed';
      },
    });
  }
}
