export interface Flashcard {
  _id?: string;
  term: string;
  reading: string[];
  definition: string;
  created_at?: string;
  updated_at?: string;
} 