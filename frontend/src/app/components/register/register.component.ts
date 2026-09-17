import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container" style="max-width:400px;">
      <div class="card">
        <h2>Create Attendant Account</h2>
        <form (ngSubmit)="submit()" style="display:flex; flex-direction:column; gap:12px;">
          <input type="text" placeholder="Username" [(ngModel)]="username" name="username" required>
          <input type="password" placeholder="Password" [(ngModel)]="password" name="password" required>
          <button class="btn" type="submit" [disabled]="loading">{{ loading ? 'Creating...' : 'Register' }}</button>
        </form>
        <p *ngIf="error" class="error">{{ error }}</p>
        <p *ngIf="success" style="color:var(--ok); font-size:14px;">Account created — you can log in now.</p>
        <p style="margin-top:14px; font-size:14px;">Already have an account? <a routerLink="/login">Login</a></p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  username = '';
  password = '';
  loading = false;
  error = '';
  success = false;

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.error = '';
    this.loading = true;
    this.auth.register(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => this.router.navigate(['/login']), 1000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail || 'Registration failed';
      },
    });
  }
}
