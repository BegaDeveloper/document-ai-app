import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Firestore, collectionData, collection, getDocs } from '@angular/fire/firestore';
import { ExtractionData } from '../interfaces/upload.interface';
import { Features } from '../interfaces/analysis.interface';


@Injectable({
  providedIn: 'root'
})
export class FeatureService {
  private featuresCollection = collection(this.afs, 'features');
  constructor(private afs: Firestore) { }

  /**
   *
   * @returns List of all features.
   */
  async list(): Promise<Features[]> {
    const featuresSnapshot = await getDocs(this.featuresCollection);
    const features = featuresSnapshot.docs.map(doc => doc.data());
    return features as Features[];
  }
}