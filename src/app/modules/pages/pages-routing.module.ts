import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OverviewComponent } from './overview/overview.component';
import { AnalysisComponent } from './analysis/analysis.component';
import { UploadComponent } from './upload/upload.component';
import { PagesComponent } from './pages.component';

const routes: Routes = [
  { path: '', redirectTo: 'upload', pathMatch: 'full' },
  {
    path: '',
    component: PagesComponent,
    children: [
      { path: 'upload', component: UploadComponent },
      { path: 'overview', component: OverviewComponent },
      { path: 'analysis', component: AnalysisComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {}
