import { NgModule } from '@angular/core';
import { ButtonModule } from 'primeng/button';
//import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { PanelModule } from 'primeng/panel';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
//import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DropdownModule, FieldWrapperModule } from 'ethos-uikit';
import { TranslationModule } from 'ethos-uikit';
import { PeriodModule } from 'ethos-uikit';
import { SaveCancelModule } from 'ethos-uikit';
import { DialogModule } from 'ethos-uikit';

@NgModule({
  declarations: [],
  imports: [
    ButtonModule,
    DropdownModule,
    FileUploadModule,
    TableModule,
    ToastModule,
    PanelModule,
    MenuModule,
    InputTextModule,
    DialogModule,
    TooltipModule,
    AvatarModule,
    ProgressSpinnerModule,
    FieldWrapperModule,
    TranslationModule.forRoot(''),
    PeriodModule,
    SaveCancelModule,
  ],
  exports: [
    ButtonModule,
    DropdownModule,
    FileUploadModule,
    TableModule,
    ToastModule,
    PanelModule,
    MenuModule,
    InputTextModule,
    DialogModule,
    TooltipModule,
    AvatarModule,
    ProgressSpinnerModule,
    FieldWrapperModule,
    TranslationModule,
    PeriodModule,
    SaveCancelModule,
  ],
})
export class PrimeModule {}
