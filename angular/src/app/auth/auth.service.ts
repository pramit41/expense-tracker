import { Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  getCurrentUser,
  fetchAuthSession,
  type SignInOutput,
} from "aws-amplify/auth";

export interface AuthUser {
  username: string;
  email: string;
}

@Injectable({ providedIn: "root" })
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
      const email =
        (session.tokens?.idToken?.payload["email"] as string) ?? user.username;
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
      this.router.navigate(["/expenses"]);
    }
    return result;
  }

  async register(email: string, password: string): Promise<void> {
    await signUp({
      username: email,
      password,
      options: { userAttributes: { email } },
    });
  }

  async confirmEmail(email: string, code: string): Promise<void> {
    await confirmSignUp({ username: email, confirmationCode: code });
    this.router.navigate(["/login"]);
  }

  async logout(): Promise<void> {
    await signOut();
    this.currentUser.set(null);
    this.router.navigate(["/login"]);
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
