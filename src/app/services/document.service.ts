import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Firestore, collectionData, collection, getDoc, addDoc, updateDoc, deleteDoc, doc } from '@angular/fire/firestore';
import { Document } from '../interfaces/upload.interface';
import { FireStorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private documentsCollection = collection(this.afs, 'documents');
  constructor(
    private afs: Firestore,
    private fireStorageService: FireStorageService
  ) { }

  /**
   *
   * @returns List of all documents sorted by name.
   */
  list(): Observable<Document[]> {
    return collectionData(this.documentsCollection, { idField: 'id' }).pipe(
      map(documents => documents as Document[])
    );
  }

  /**
   * 
   * @param document The document to create.
   * @returns The id of the created document.
   */
  async create(document: Omit<Document, 'id'>): Promise<string> {
    const file = document.file;
    delete document.file;
    const docRef = await addDoc(this.documentsCollection, document);
    await this.update(docRef.id, { bucket_path: docRef.id, id: docRef.id });
    if(file) {
      await this.fireStorageService.uploadFile(file, docRef.id);
    }
    
    return docRef.id;
  }

  /**
   * 
   * @param extractionId The id of the document to update.
   * @param document The document to update.
   */
  async update(extractionId: string, document: Partial<Document>): Promise<void> {
    const docRef = doc(this.afs, `documents/${extractionId}`);
    await updateDoc(docRef, document);
  }

  /**
   * 
   * @param extractionId The id of the document to delete.
   */
  async delete(extractionId: string): Promise<void> {
    const docRef = doc(this.afs, `documents/${extractionId}`);
    await deleteDoc(docRef);
  }

  /**
   * 
   * @param extractionId The id of the document to get.
   * @returns The document with the given id.
   */
  async get(extractionId: string): Promise<Document> {
    const docRef = doc(this.afs, `documents/${extractionId}`);
    const document = await getDoc(docRef);
    return document.data() as Document;
  }
}