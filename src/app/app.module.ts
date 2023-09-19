import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PagesModule } from './modules/pages/pages.module';
import { PrimeModule } from './prime.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { environment } from '../environments/environment';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import { AuthComponent } from './authentication/auth/auth.component';
import { MessageService } from 'primeng/api';
import { SharedModule } from './modules/shared/shared.module';

@NgModule({
  declarations: [AppComponent, AuthComponent],
  imports: [
    SharedModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    PagesModule,
    PrimeModule,
    BrowserAnimationsModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideAuth(() => getAuth()),
  ],
  providers: [MessageService],
  bootstrap: [AppComponent],
  exports: [],
})
export class AppModule {}
