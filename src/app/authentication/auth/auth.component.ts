import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/authentication.service';
import { SharedService } from 'src/app/services/shared.service';
import { MESSAGE } from 'src/assets/messages';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit {
  authForm: FormGroup;
  recoverMode: boolean = false;

  constructor(private authService: AuthService, private sharedService: SharedService, private router: Router) {}
  ngOnInit(): void {
    this.authForm = new FormGroup({
      email: new FormControl(null, [Validators.required, Validators.email]),
      password: new FormControl(null, [Validators.required]),
    });
  }

  submit() {
    if (!this.authForm.valid) {
      return;
    }

    const email = this.authForm.value.email;
    const password = this.authForm.value.password;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.sharedService.showMessage('success', 'Success', MESSAGE.success_login);
        this.router.navigate(['/main/overview']);
      },
      error: (error) => {
        this.sharedService.showMessage('error', 'Error', error);
      },
    });

    this.authForm.reset();
  }

  onRecoverPassword() {
    const email = this.authForm.value.email;
    if (!email) {
      this.sharedService.showMessage('error', 'Error', 'Please enter your email address');
      return;
    }

    this.authService.sendPasswordResetEmail(email).subscribe({
      next: (response) => {
        this.sharedService.showMessage('success', 'Success', MESSAGE.success_password_recovery);
      },
      error: (error) => {
        this.sharedService.showMessage('error', 'Error', MESSAGE.error_password_recovery);
      },
    });
  }

  toggleRecoverMode() {
    this.recoverMode = !this.recoverMode;
    if (this.recoverMode) {
      this.authForm.get('password')?.clearValidators();
    } else {
      this.authForm.get('password')?.setValidators([Validators.required]);
    }
    this.authForm.get('password')?.updateValueAndValidity();
  }
}
