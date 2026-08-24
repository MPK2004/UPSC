export interface Chapter {
  id: string;
  subject: 'Geography' | 'Environment';
  book: string;
  chapter_number: number;
  title: string;
  description: string;
  total_cards: number;
  brick_weight: number;
}

export interface ByteCard {
  id: string;
  chapter_id: string;
  subject: 'Geography' | 'Environment';
  title: string;
  concept_type: 'Fact' | 'Mnemonic' | 'Visual Diagram' | 'Prelims Alert';
  diagram_svg?: string;
  diagram_url?: string;
  bullet_points: string[];
  mnemonic?: string;
  upsc_prelims_tip?: string;
}

export interface PYQQuestion {
  id: string;
  subject: 'Geography' | 'Environment';
  chapter_id: string;
  chapter_name: string;
  year: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
}

export interface ItemReport {
  question_id: string;
  question: string;
  user_choice: number;
  correct_choice: number;
  correct_option_text: string;
  explanation: string;
  status: 'Correct' | 'Wrong' | 'Unattempted';
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
