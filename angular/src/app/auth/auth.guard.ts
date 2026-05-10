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
