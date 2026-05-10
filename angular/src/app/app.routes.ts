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
