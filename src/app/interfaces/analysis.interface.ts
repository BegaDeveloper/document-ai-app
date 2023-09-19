import { BoundingBox, LocalizedBoundingBox } from './shared.interface';
export interface Prediction {
  company_id: string;
  id: string;
  model_version: string;
  year: number;
  predictions: PredictionsList[];
}

export interface PredictionsList {
  bounding_box: LocalizedBoundingBox;
}

export interface Features {
  name: string;
  type: string;
  id: string;
  title: string;
  description: string;
  categories: string[];
}
