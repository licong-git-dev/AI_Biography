export interface Chapter {
  id: string;
  number: number;
  title: string;
  filename: string;
  content: string;
  wordCount: number;
  summary?: string;
}
