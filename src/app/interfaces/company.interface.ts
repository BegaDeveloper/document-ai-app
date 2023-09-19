export interface CompanyDTO {
  id: string;
  name: string;
  question_config: QuestionConfig[];
}

export interface QuestionConfig {
  feature_id: string;
  question: string;
}
