import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './authentication/auth/auth.component';
import { AuthGuard } from './authentication/auth/auth.guard';

const routes: Routes = [
  {
    path: 'main',
    canActivate: [AuthGuard],
    loadChildren: () => import('./modules/pages/pages.module').then((m) => m.PagesModule),
  },
  { path: 'auth', component: AuthComponent },
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
