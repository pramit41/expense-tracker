import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { AuthService } from "../auth.service";

@Component({
    selector: "app-login",
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
    ],
    template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1>Expense Tracker</h1>
        <h2>Sign in</h2>
        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input
              matInput
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              email
              autocomplete="email"
            />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input
              matInput
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              autocomplete="current-password"
            />
          </mat-form-field>
          @if (errorMessage()) {
            <p class="error-message">{{ errorMessage() }}</p>
          }
          <button
            mat-flat-button
            color="primary"
            type="submit"
            [disabled]="isLoading() || loginForm.invalid"
          >
            @if (isLoading()) {
              <mat-spinner diameter="20" />
            } @else {
              Sign in
            }
          </button>
        </form>
        <p class="auth-link">
          Don't have an account? <a routerLink="/register">Create one</a>
        </p>
      </div>
    </div>
  `,
    styles: [
        `
      .auth-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: #f5f5f5;
      }
      .auth-card {
        background: white;
        padding: 2.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 400px;
      }
      h1 {
        font-size: 1.2rem;
        color: #666;
        margin: 0 0 0.25rem;
        font-weight: 400;
      }
      h2 {
        font-size: 1.8rem;
        margin: 0 0 1.5rem;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      mat-form-field {
        width: 100%;
      }
      button[type="submit"] {
        height: 48px;
        margin-top: 0.5rem;
        font-size: 1rem;
      }
      .error-message {
        color: #d32f2f;
        font-size: 0.875rem;
        margin: 0;
      }
      .auth-link {
        text-align: center;
        margin-top: 1.5rem;
        font-size: 0.9rem;
        color: #666;
      }
      mat-spinner {
        margin: 0 auto;
      }
    `,
    ]
})
export class LoginComponent {
  email = "";
  password = "";
  isLoading = signal(false);
  errorMessage = signal("");

  constructor(private auth: AuthService) {}

  async onSubmit(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set("");
    try {
      await this.auth.login(this.email, this.password);
    } catch (err: unknown) {
      this.errorMessage.set(
        err instanceof Error ? err.message : "Login failed.",
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
