import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PagesRoutingModule } from './pages-routing.module';
import { UploadComponent } from './upload/upload.component';
import { PrimeModule } from 'src/app/prime.module';
import { OverviewComponent } from './overview/overview.component';
import { AnalysisComponent } from './analysis/analysis.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { SharedModule } from '../shared/shared.module';
import { PagesComponent } from './pages.component';


@NgModule({
  declarations: [
    PagesComponent,
    UploadComponent,
    OverviewComponent,
    AnalysisComponent,
  ],
  imports: [
    SharedModule,
    CommonModule,
    PagesRoutingModule,
    PrimeModule,
    FormsModule,
    ReactiveFormsModule,
    PdfViewerModule,
  ],
  exports: [],
})
export class PagesModule {}
