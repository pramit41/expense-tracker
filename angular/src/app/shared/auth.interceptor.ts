import { inject } from "@angular/core";
import { HttpInterceptorFn, HttpErrorResponse } from "@angular/common/http";
import { from, switchMap, catchError, throwError } from "rxjs";
import { Router } from "@angular/router";
import { AuthService } from "../auth/auth.service";
import { environment } from "../../environments/environment";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  return from(auth.getIdToken()).pipe(
    switchMap((token) => {
      if (!token) {
        router.navigate(["/login"]);
        return throwError(() => new Error("No auth token"));
      }
      return next(req.clone({ setHeaders: { Authorization: token } }));
    }),
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) router.navigate(["/login"]);
      return throwError(() => err);
    }),
  );
};
