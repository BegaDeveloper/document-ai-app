export interface BoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface LocalizedBoundingBox {
  page: number;
  document_id: string;
  bounding_box: BoundingBox;
}

export interface FeaturePrediction {
  feature_id: string;
  id?: string;
  bounding_box: LocalizedBoundingBox;
  value: string | number;
  unit: string;
  confidence: number;
}

export interface Prediction {
  id: string;
  company_id: string;
  year: number;
  predictions: FeaturePrediction[];
  model_version: string;
  type: 'automatic' | 'manual'
  extraction_id: string;
  accepted: boolean;
}

export interface Label {
  id: string;
  feature_id: string;
  feature_name?: string;
  bounding_box: LocalizedBoundingBox;
  value: string | number;
  unit: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

export interface Question {
  feature: string;
  question: string;
}

export interface Company {
  id: string;
  name: string;
  question_config: Question[];
}

export interface PDF_DTO {
  currentDocIndex: number;
  currentPage: number;
  rectangles: fabric.Rect[];
  canvas: {
    width: number;
    height: number;
  }
}
