import { DocumentType, ExtractionStatusType } from 'src/assets/enums';


export interface ExtractionData {
  company_id: string;
  company_name?: string;
  id?: string;
  original_company_id?: string;
  year: number;
  status: ExtractionStatusType;
  documents: Document[];
}

export interface ExtractionWithId extends ExtractionData {
  id: string;
}

export interface Document {
  type: DocumentType;
  bucket_path: string;
  name: string;
  id: string;
  file?: File
}

export interface Year {
  year: number;
  name: string;
}