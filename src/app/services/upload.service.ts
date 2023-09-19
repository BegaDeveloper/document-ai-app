import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';

import { Firestore, collection } from '@angular/fire/firestore';
import { ExtractionData } from '../interfaces/upload.interface';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private extractionsRef: any;

  constructor(private http: HttpClient, private firestore: Firestore) {
    this.extractionsRef = collection(this.firestore, 'extractions');
  }

  /**
  Sends a POST request to the server to add a new company.
  @param {Company} company - The company to be added.
  @returns {Observable} - Observable that emits the response from the server.
  */
  post(extractionData: ExtractionData): Observable<any> {
    return from(this.extractionsRef.add(extractionData));
  }
}
