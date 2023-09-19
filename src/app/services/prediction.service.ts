import { Injectable } from '@angular/core';
import { collection, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { Prediction } from '../interfaces/shared.interface';

@Injectable({
  providedIn: 'root',
})
export class PredictionService {
  private predictionsCollection = collection(this.afs, 'predictions');
  constructor(private afs: Firestore) { }

  /**
   * @returns List of predictions by extraction id.
   */
  async getPredictionsByExtractionId(extractionId: string): Promise<Prediction[]> {
    const q = query(this.predictionsCollection, where('extraction_id', '==', extractionId));
    const docsSnapshot = await getDocs(q);
    const predictions = docsSnapshot.docs.map((doc) => doc.data());
    return predictions as Prediction[];
  }
}
