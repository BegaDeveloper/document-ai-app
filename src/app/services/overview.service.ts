import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CompanyDTO } from '../interfaces/company.interface';

@Injectable({
  providedIn: 'root',
})
export class OverviewService {
  constructor(private http: HttpClient) {}

  /**
   * Returns an observable that retrieves company data from a JSON file.
   *
   * @returns {Observable<CompanyDTO[]>} An observable that emits an array of CompanyData objects.
   */
  get(): Observable<CompanyDTO[]> {
    return this.http.get<any>('assets/data.json').pipe(
      map((res) => <CompanyDTO[]>res.data),
      map((data) => {
        return data;
      })
    );
  }
}
