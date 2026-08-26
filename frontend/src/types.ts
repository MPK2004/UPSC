export type ContentStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface Source {
  title: string;
  url: string;
  tier: string;
}

export interface Book {
  id: string;
  title: string;
  subject: string | null;
  storage_path: string;
  status: ContentStatus;
  approach_guide: string | null;
  error_message: string | null;
  uploaded_at: string;
  processed_at: string | null;
}

export interface Chapter {
  id: string;
  book_id: string;
  chapter_number: number | null;
  title: string;
  page_start: number | null;
  page_end: number | null;
  importance_label: 'High' | 'Medium' | 'Low' | null;
  importance_note: string | null;
  approach_guide: string | null;
  status: ContentStatus;
  error_message: string | null;
  sources?: Source[];
  created_at: string;
}

export interface ByteCard {
  id: string;
  chapter_id: string;
  title: string;
  concept_type: string;
  diagram_url?: string;
  bullet_points: string[];
  mnemonic?: string;
  upsc_prelims_tip?: string;
  sort_order?: number | null;
  sources?: Source[];
}

export interface PYQQuestion {
  id: string;
  chapter_id: string;
  year: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  difficulty: string;
  sources?: Source[];
}

export interface ItemReport {
  question_id: string;
  question: string;
  user_choice: number;
  correct_choice: number;
  correct_option_text: string;
  explanation: string;
  status: 'Correct' | 'Wrong' | 'Unattempted';
  sources?: Source[];
}

export interface DiagnosticReport {
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  unattempted_count: number;
  total_marks: number;
  max_possible_marks: number;
  accuracy_percentage: number;
  mastery_achieved: boolean;
  recommendation: string;
  recommendation_action: 'CONTINUE' | 'REVIEW' | 'INVEST_TIME';
  item_reports: ItemReport[];
}

export interface SavedNote {
  id: string;
  card_id: string;
  title: string;
  subject: string;
  content: string;
  created_at: string;
}
