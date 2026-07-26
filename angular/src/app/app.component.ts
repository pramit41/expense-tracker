import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule],
  template: `
    <mat-toolbar color="primary" *ngIf="auth.isLoggedIn">
      <span>Expense Tracker</span>
      <span class="spacer"></span>
      <button mat-button routerLink="/dashboard">Dashboard</button>
      <button mat-button routerLink="/expenses">Expenses</button>
      <span class="user-email">{{ auth.currentUser()?.email }}</span>
      <button mat-stroked-button class="logout-button" (click)="auth.logout()">Sign out</button>
    </mat-toolbar>
    <router-outlet />
  `,
  styles: [
    '.spacer { flex: 1 1 auto; }',
    '.user-email { margin: 0 0.75rem; opacity: 0.9; font-size: 0.9rem; }',
    '.logout-button { margin-left: 0.25rem; }',
  ],
})
export class AppComponent {
  constructor(public auth: AuthService, private router: Router) {}
}
