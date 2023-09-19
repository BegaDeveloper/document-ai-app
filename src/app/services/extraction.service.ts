import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Firestore, collectionData, collection, getDoc, addDoc, updateDoc, deleteDoc, doc } from '@angular/fire/firestore';
import { ExtractionData } from '../interfaces/upload.interface';
import { DocumentService } from './document.service';
import { ExtractionStatusType } from 'src/assets/enums';


@Injectable({
  providedIn: 'root'
})
export class ExtractionService {
  private extractionsCollection = collection(this.afs, 'extractions');
  constructor(private afs: Firestore, private documentService: DocumentService) { }

  /**
   *
   * @returns List of all extractions sorted by name.
   */
  list(): Observable<ExtractionData[]> {
    return collectionData(this.extractionsCollection, { idField: 'id' }).pipe(
      map(extractions => extractions as ExtractionData[])
    );
  }

  /**
   * 
   * @param extraction The extraction to create.
   * @returns The id of the created extraction.
   */
  async create(extraction: Omit<ExtractionData, 'id'>): Promise<string> {

    // create documents for each document in the extraction
    await Promise.all(extraction.documents.map(async document => {
      const docId = await this.documentService.create(document);
      document.id = docId;
      document.bucket_path = docId;
    }));

    console.log(extraction)
    const docRef = await addDoc(this.extractionsCollection, extraction);
    return docRef.id;
  }

  /**
   * 
   * @param extractionId The id of the extraction to update.
   * @param extraction The extraction to update.
   * @param pending Whether or not the extraction should be set to pending.
   */
  async update(extractionId: string, extraction: Partial<Omit<ExtractionData, 'id'>>, pending = true): Promise<void> {

    // update documents for each document in the extraction or create if it doesn't exist
    // @ts-ignore
    await Promise.all(extraction.documents.map(async document => {
      if (document.id) {
        await this.documentService.update(document.id, document);
      } else {
        document.id = await this.documentService.create(document);
      }
    }));

    const docRef = doc(this.afs, `extractions/${extractionId}`);
    if (pending) {
      extraction.status = ExtractionStatusType.PENDING;
    }
    await updateDoc(docRef, extraction);
  }

  /**
   * 
   * @param extractionId The id of the extraction to update.
   * @param documentId The id of the document to delete.
   */
  async deleteDocument(extractionId: string, documentId: string): Promise<void> {
    const docRef = doc(this.afs, `extractions/${extractionId}`);
    const extraction = await getDoc(docRef);
    const extractionData = extraction.data() as ExtractionData;
    await updateDoc(docRef, { documents: extractionData.documents.filter((d) => d.id !== documentId), status: ExtractionStatusType.PENDING });
    await this.documentService.delete(documentId);
  }

  /**
   * 
   * @param extractionId The id of the extraction to delete.
   */
  async delete(extractionId: string): Promise<void> {
    const docRef = doc(this.afs, `extractions/${extractionId}`);
    await deleteDoc(docRef);
  }

  /**
   * 
   * @param extractionId The id of the extraction to get.
   * @returns The extraction with the given id.
   */
  async get(extractionId: string): Promise<ExtractionData> {
    const docRef = doc(this.afs, `extractions/${extractionId}`);
    const extraction = await getDoc(docRef);
    return extraction.data() as ExtractionData;
  }

}