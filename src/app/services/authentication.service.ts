import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, from, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  UserCredential,
} from '@angular/fire/auth';
import { User } from '../interfaces/user.model';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _user = new BehaviorSubject<User | null>(null);
  user = this._user.asObservable();
  private auth: Auth = inject(Auth);

  constructor(private route: Router) {}

  login(email: string, password: string) {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      catchError((error) => {
        return this.handleError({ code: error.code, message: error.message });
      }),
      switchMap(async (credential: UserCredential) => {
        const idTokenResult = await credential.user.getIdTokenResult();
        const expiresIn = parseInt(idTokenResult.expirationTime);
        this.handleAuth(credential.user.email ?? '', credential.user.uid, idTokenResult.token, expiresIn);
        return credential;
      })
    );
  }

  logout() {
    signOut(this.auth);
    this._user.next(null!);
    this.route.navigate(['/auth']);
  }

  sendPasswordResetEmail(email: string) {
    return from(firebaseSendPasswordResetEmail(this.auth, email)).pipe(catchError(this.handleError));
  }
  private handleAuth(email: string, userId: string, token: string, expiresIn: number) {
    const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
    const user = new User(email, userId, token, expirationDate);
    this._user.next(user);
  }

  private handleError(error: { code: string; message: string }) {
    let errorMessage = 'An unknown error occurred!';
    if (!error || !error.code) {
      return throwError(() => errorMessage);
    }

    errorMessage = this.getErrorMessage(error.code);
    return throwError(() => errorMessage);
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-not-found':
      case 'auth/user-not-found':
        return 'Email does not exist.';
      case 'auth/wrong-password':
        return 'This password is not valid.';
      case 'auth/invalid-email':
        return 'This email is not valid.';
      default:
        return 'An unknown error occurred!';
    }
  }
}
