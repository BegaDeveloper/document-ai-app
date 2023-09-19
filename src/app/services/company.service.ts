import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Firestore, collectionData, collection, getDoc, addDoc, updateDoc, deleteDoc, doc } from '@angular/fire/firestore';
import { Company } from '../interfaces/shared.interface';
@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  private companiesCollection = collection(this.afs, 'companies');
  constructor(private afs: Firestore) { }

  /**
   *
   * @returns List of all companies sorted by name.
   */
  list(): Observable<Company[]> {
    return collectionData(this.companiesCollection, { idField: 'id' }).pipe(
      map(companies => this.sort_by_name(companies as Company[]))
    );
  }

  /**
   * 
   * @param company The company to create.
   * @returns The id of the created company.
   */
  async create(company: Omit<Company, 'id'>): Promise<string> {
    const docRef = await addDoc(this.companiesCollection, company);
    return docRef.id;
  }

  /**
   * 
   * @param companyId The id of the company to update.
   * @param company The company to update.
   */
  async update(companyId: string, company: Partial<Omit<Company, 'id'>>): Promise<void> {
    const docRef = doc(this.afs, `companies/${companyId}`);
    await updateDoc(docRef, company);
  }

  /**
   * 
   * @param companyId The id of the company to delete.
   */
  async delete(companyId: string): Promise<void> {
    const docRef = doc(this.afs, `companies/${companyId}`);
    await deleteDoc(docRef);
  }

  /**
   * 
   * @param companyId The id of the company to get.
   * @returns The company with the given id.
   */
  async get(companyId: string): Promise<Company> {
    const docRef = doc(this.afs, `companies/${companyId}`);
    const document = await getDoc(docRef);
    return document.data() as Company;
  }

  sort_by_name(companies: Company[]): Company[] {
    return companies.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      } else {
        return 1;
      }
    })
  }
}