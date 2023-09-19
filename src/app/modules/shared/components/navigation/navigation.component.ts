import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/authentication.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnInit {
  constructor(private authService: AuthService) {}
  ngOnInit(): void {}

  onLogout() {
    this.authService.logout();
  }
}
