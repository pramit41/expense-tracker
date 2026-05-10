import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatToolbarModule],
  template: `
    <mat-toolbar color="primary">
      <span>Expense Tracker</span>
      <span style="flex:1"></span>
      <span style="font-size:0.9rem; margin-right:1rem; opacity:0.85">{{ auth.currentUser()?.email }}</span>
      <button mat-stroked-button (click)="auth.logout()">Sign out</button>
    </mat-toolbar>
    <div class="placeholder">
      <h2>✅ Phase 2 complete — you're logged in!</h2>
      <p>The expenses list and receipt upload will be built in Phase 3.</p>
      <p style="color:#666; font-size:0.9rem">Logged in as: <strong>{{ auth.currentUser()?.email }}</strong></p>
    </div>
  `,
  styles: [`
    .placeholder { max-width:600px; margin:4rem auto; text-align:center; padding:2rem; }
    h2 { font-size:1.8rem; margin-bottom:1rem; }
    p { color:#444; line-height:1.6; }
  `],
})
export class ExpensesComponent {
  constructor(public auth: AuthService) {}
}
