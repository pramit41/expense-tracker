#!/bin/bash
# ============================================================
# Expense Tracker — Phase 2 Setup
# Run from your project root:
#   cd ~/Documents/expense-tracker
#   bash phase2-setup.sh
# ============================================================

set -e  # stop on any error

ROOT="$HOME/Documents/expense-tracker"
cd "$ROOT"

echo "📁 Creating directory structure..."
mkdir -p angular/src/{app/{auth/login,auth/register,expenses,shared},environments,assets}

# ── ANGULAR: package.json ──────────────────────────────────────
echo "📦 Writing angular/package.json..."
cat > angular/package.json << 'EOF'
{
  "name": "expense-tracker-angular",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "build:prod": "ng build --configuration production",
    "test": "ng test"
  },
  "dependencies": {
    "@angular/animations": "^17.0.0",
    "@angular/common": "^17.0.0",
    "@angular/compiler": "^17.0.0",
    "@angular/core": "^17.0.0",
    "@angular/forms": "^17.0.0",
    "@angular/material": "^17.0.0",
    "@angular/platform-browser": "^17.0.0",
    "@angular/platform-browser-dynamic": "^17.0.0",
    "@angular/router": "^17.0.0",
    "aws-amplify": "^6.0.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.14.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^17.0.0",
    "@angular/cli": "^17.0.0",
    "@angular/compiler-cli": "^17.0.0",
    "@types/node": "^20.0.0",
    "typescript": "~5.2.0"
  }
}
EOF

# ── ANGULAR: tsconfig.json ─────────────────────────────────────
echo "📦 Writing angular/tsconfig.json..."
cat > angular/tsconfig.json << 'EOF'
{
  "compileOnSave": false,
  "compilerOptions": {
    "baseUrl": "./",
    "outDir": "./dist/out-tsc",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "sourceMap": true,
    "declaration": false,
    "experimentalDecorators": true,
    "moduleResolution": "bundler",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "useDefineForClassFields": false,
    "lib": ["ES2022", "dom"]
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
EOF

# ── ANGULAR: angular.json ──────────────────────────────────────
echo "⚙️  Writing angular/angular.json..."
cat > angular/angular.json << 'EOF'
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "expense-tracker": {
      "projectType": "application",
      "schematics": {
        "@schematics/angular:component": { "style": "scss" }
      },
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "outputPath": "dist/expense-tracker",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "polyfills": ["zone.js"],
            "tsConfig": "tsconfig.json",
            "assets": ["src/favicon.ico", "src/assets"],
            "styles": ["src/styles.scss"],
            "scripts": []
          },
          "configurations": {
            "production": {
              "budgets": [
                { "type": "initial", "maximumWarning": "500kb", "maximumError": "1mb" }
              ],
              "fileReplacements": [
                { "replace": "src/environments/environment.ts", "with": "src/environments/environment.prod.ts" }
              ],
              "outputHashing": "all"
            },
            "development": {
              "optimization": false,
              "extractLicenses": false,
              "sourceMap": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "configurations": {
            "production": { "buildTarget": "expense-tracker:build:production" },
            "development": { "buildTarget": "expense-tracker:build:development" }
          },
          "defaultConfiguration": "development"
        }
      }
    }
  }
}
EOF

# ── ANGULAR: environments ──────────────────────────────────────
echo "🌍 Writing environment files..."
cat > angular/src/environments/environment.ts << 'EOF'
// Fill these in after running `cdk deploy` in the infra/ folder.
// The values come from the CDK Outputs printed in your terminal.
export const environment = {
  production: false,
  apiUrl: 'https://REPLACE_ME.execute-api.us-east-1.amazonaws.com/dev',
  cognito: {
    userPoolId: 'us-east-1_REPLACE_ME',
    userPoolClientId: 'REPLACE_ME',
    region: 'us-east-1',
  },
};
EOF

cat > angular/src/environments/environment.prod.ts << 'EOF'
export const environment = {
  production: true,
  apiUrl: 'https://REPLACE_ME.execute-api.us-east-1.amazonaws.com/prod',
  cognito: {
    userPoolId: 'us-east-1_REPLACE_ME',
    userPoolClientId: 'REPLACE_ME',
    region: 'us-east-1',
  },
};
EOF

# ── ANGULAR: main.ts & app.component ──────────────────────────
echo "🔧 Writing Angular entry points..."
cat > angular/src/main.ts << 'EOF'
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
EOF

cat > angular/src/index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Expense Tracker</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.gstatic.com" />
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
  </head>
  <body class="mat-typography">
    <app-root></app-root>
  </body>
</html>
EOF

cat > angular/src/styles.scss << 'EOF'
@use '@angular/material' as mat;
@include mat.core();

$theme: mat.define-theme((
  color: (
    theme-type: light,
    primary: mat.$indigo-palette,
  ),
));

html { @include mat.all-component-themes($theme); }
* { box-sizing: border-box; }
body { margin: 0; font-family: Roboto, 'Helvetica Neue', sans-serif; background: #f5f5f5; }
EOF

cat > angular/src/app/app.component.ts << 'EOF'
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {}
EOF

# ── ANGULAR: app.config.ts ─────────────────────────────────────
cat > angular/src/app/app.config.ts << 'EOF'
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Amplify } from 'aws-amplify';
import { routes } from './app.routes';
import { authInterceptor } from './shared/auth.interceptor';
import { environment } from '../environments/environment';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: environment.cognito.userPoolId,
      userPoolClientId: environment.cognito.userPoolClientId,
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
EOF

# ── ANGULAR: app.routes.ts ─────────────────────────────────────
cat > angular/src/app/app.routes.ts << 'EOF'
import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'expenses',
    loadComponent: () => import('./expenses/expenses.component').then((m) => m.ExpensesComponent),
    canActivate: [authGuard],
  },
  { path: '', redirectTo: '/expenses', pathMatch: 'full' },
  { path: '**', redirectTo: '/expenses' },
];
EOF

# ── ANGULAR: auth.service.ts ───────────────────────────────────
echo "🔐 Writing auth files..."
cat > angular/src/app/auth/auth.service.ts << 'EOF'
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  signIn, signOut, signUp, confirmSignUp,
  getCurrentUser, fetchAuthSession, type SignInOutput,
} from 'aws-amplify/auth';

export interface AuthUser {
  username: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<AuthUser | null>(null);
  isLoading = signal(true);

  constructor(private router: Router) {
    this.checkSession();
  }

  async checkSession(): Promise<void> {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      const email = session.tokens?.idToken?.payload['email'] as string ?? user.username;
      this.currentUser.set({ username: user.username, email });
    } catch {
      this.currentUser.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  async login(email: string, password: string): Promise<SignInOutput> {
    const result = await signIn({ username: email, password });
    if (result.isSignedIn) {
      await this.checkSession();
      this.router.navigate(['/expenses']);
    }
    return result;
  }

  async register(email: string, password: string): Promise<void> {
    await signUp({ username: email, password, options: { userAttributes: { email } } });
  }

  async confirmEmail(email: string, code: string): Promise<void> {
    await confirmSignUp({ username: email, confirmationCode: code });
    this.router.navigate(['/login']);
  }

  async logout(): Promise<void> {
    await signOut();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  async getIdToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() ?? null;
    } catch {
      return null;
    }
  }

  get isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }
}
EOF

# ── ANGULAR: auth.guard.ts ─────────────────────────────────────
cat > angular/src/app/auth/auth.guard.ts << 'EOF'
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoading()) {
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (!auth.isLoading()) { clearInterval(interval); resolve(); }
      }, 50);
    });
  }

  return auth.isLoggedIn ? true : router.createUrlTree(['/login']);
};
EOF

# ── ANGULAR: auth.interceptor.ts ──────────────────────────────
cat > angular/src/app/shared/auth.interceptor.ts << 'EOF'
import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { from, switchMap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  return from(auth.getIdToken()).pipe(
    switchMap((token) => {
      if (!token) { router.navigate(['/login']); return throwError(() => new Error('No auth token')); }
      return next(req.clone({ setHeaders: { Authorization: token } }));
    }),
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) router.navigate(['/login']);
      return throwError(() => err);
    })
  );
};
EOF

# ── ANGULAR: login.component.ts ────────────────────────────────
echo "🖥️  Writing components..."
cat > angular/src/app/auth/login/login.component.ts << 'EOF'
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1>Expense Tracker</h1>
        <h2>Sign in</h2>
        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" [(ngModel)]="email" name="email" required email autocomplete="email" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput type="password" [(ngModel)]="password" name="password" required autocomplete="current-password" />
          </mat-form-field>
          @if (errorMessage()) { <p class="error-message">{{ errorMessage() }}</p> }
          <button mat-flat-button color="primary" type="submit" [disabled]="isLoading() || loginForm.invalid">
            @if (isLoading()) { <mat-spinner diameter="20" /> } @else { Sign in }
          </button>
        </form>
        <p class="auth-link">Don't have an account? <a routerLink="/register">Create one</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f5f5f5; }
    .auth-card { background:white; padding:2.5rem; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.1); width:100%; max-width:400px; }
    h1 { font-size:1.2rem; color:#666; margin:0 0 0.25rem; font-weight:400; }
    h2 { font-size:1.8rem; margin:0 0 1.5rem; }
    form { display:flex; flex-direction:column; gap:0.5rem; }
    mat-form-field { width:100%; }
    button[type=submit] { height:48px; margin-top:0.5rem; font-size:1rem; }
    .error-message { color:#d32f2f; font-size:0.875rem; margin:0; }
    .auth-link { text-align:center; margin-top:1.5rem; font-size:0.9rem; color:#666; }
    mat-spinner { margin:0 auto; }
  `],
})
export class LoginComponent {
  email = ''; password = '';
  isLoading = signal(false); errorMessage = signal('');
  constructor(private auth: AuthService) {}
  async onSubmit(): Promise<void> {
    this.isLoading.set(true); this.errorMessage.set('');
    try { await this.auth.login(this.email, this.password); }
    catch (err: unknown) { this.errorMessage.set(err instanceof Error ? err.message : 'Login failed.'); }
    finally { this.isLoading.set(false); }
  }
}
EOF

# ── ANGULAR: register.component.ts ────────────────────────────
cat > angular/src/app/auth/register/register.component.ts << 'EOF'
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../auth.service';

type Step = 'register' | 'confirm';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1>Expense Tracker</h1>
        @if (step() === 'register') {
          <h2>Create account</h2>
          <form (ngSubmit)="onRegister()" #regForm="ngForm">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" [(ngModel)]="email" name="email" required email autocomplete="email" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput type="password" [(ngModel)]="password" name="password" required minlength="8" autocomplete="new-password" />
              <mat-hint>Min 8 chars, upper + lowercase + number</mat-hint>
            </mat-form-field>
            @if (errorMessage()) { <p class="error-message">{{ errorMessage() }}</p> }
            <button mat-flat-button color="primary" type="submit" [disabled]="isLoading() || regForm.invalid">
              @if (isLoading()) { <mat-spinner diameter="20" /> } @else { Create account }
            </button>
          </form>
          <p class="auth-link">Already have an account? <a routerLink="/login">Sign in</a></p>
        }
        @if (step() === 'confirm') {
          <h2>Check your email</h2>
          <p class="confirm-hint">We sent a 6-digit code to <strong>{{ email }}</strong></p>
          <form (ngSubmit)="onConfirm()" #confirmForm="ngForm">
            <mat-form-field appearance="outline">
              <mat-label>Confirmation code</mat-label>
              <input matInput type="text" [(ngModel)]="confirmCode" name="code" required maxlength="6" autocomplete="one-time-code" />
            </mat-form-field>
            @if (errorMessage()) { <p class="error-message">{{ errorMessage() }}</p> }
            <button mat-flat-button color="primary" type="submit" [disabled]="isLoading() || confirmForm.invalid">
              @if (isLoading()) { <mat-spinner diameter="20" /> } @else { Confirm email }
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-container { display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f5f5f5; }
    .auth-card { background:white; padding:2.5rem; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.1); width:100%; max-width:400px; }
    h1 { font-size:1.2rem; color:#666; margin:0 0 0.25rem; font-weight:400; }
    h2 { font-size:1.8rem; margin:0 0 1.5rem; }
    form { display:flex; flex-direction:column; gap:0.5rem; }
    mat-form-field { width:100%; }
    button[type=submit] { height:48px; margin-top:0.5rem; font-size:1rem; }
    .error-message { color:#d32f2f; font-size:0.875rem; margin:0; }
    .auth-link { text-align:center; margin-top:1.5rem; font-size:0.9rem; color:#666; }
    .confirm-hint { color:#555; margin-bottom:1.5rem; }
    mat-spinner { margin:0 auto; }
  `],
})
export class RegisterComponent {
  email = ''; password = ''; confirmCode = '';
  step = signal<Step>('register');
  isLoading = signal(false); errorMessage = signal('');
  constructor(private auth: AuthService) {}
  async onRegister(): Promise<void> {
    this.isLoading.set(true); this.errorMessage.set('');
    try { await this.auth.register(this.email, this.password); this.step.set('confirm'); }
    catch (err: unknown) { this.errorMessage.set(err instanceof Error ? err.message : 'Registration failed.'); }
    finally { this.isLoading.set(false); }
  }
  async onConfirm(): Promise<void> {
    this.isLoading.set(true); this.errorMessage.set('');
    try { await this.auth.confirmEmail(this.email, this.confirmCode); }
    catch (err: unknown) { this.errorMessage.set(err instanceof Error ? err.message : 'Invalid code.'); }
    finally { this.isLoading.set(false); }
  }
}
EOF

# ── ANGULAR: expenses.component.ts ────────────────────────────
cat > angular/src/app/expenses/expenses.component.ts << 'EOF'
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
EOF

echo ""
echo "✅ Phase 2 files written successfully!"
echo ""
echo "Next steps:"
echo "  1. cd infra && npm install && npm run deploy"
echo "  2. Copy the CDK output values into angular/src/environments/environment.ts"
echo "  3. cd ../angular && npm install && npm start"
echo "  4. Open http://localhost:4200 and create an account"