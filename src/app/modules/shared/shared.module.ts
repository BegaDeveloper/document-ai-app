import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeModule } from 'src/app/prime.module';
import { SortByConfidencePipe } from 'src/app/pipes/sortByConfidence.pipe';
import { PanelTogglerDirective } from 'src/app/directives/panel.directive';
import { FilterPipe } from 'src/app/pipes/filter.pipe';
import { NavigationComponent } from './components/navigation/navigation.component';
import { PdfViewComponent } from './components/pdf-viewer/pdf-viewer.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    NavigationComponent,
    PdfViewComponent,
    SortByConfidencePipe,
    PanelTogglerDirective,
    FilterPipe,
  ],
  imports: [
    CommonModule,
    PrimeModule,
    FormsModule,
    PdfViewerModule,
  ],
  exports: [
    NavigationComponent,
    PdfViewComponent,
    SortByConfidencePipe,
    PanelTogglerDirective,
    FilterPipe,
  ],
})
export class SharedModule {}
