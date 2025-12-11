export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// Minimal real-world chat example types (shared by frontend and worker)
export interface User {
  id: string;
  name: string;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number; // epoch millis
}
// SwasthyaQ Types
export type QuestionStatus = 'Draft' | 'Submitted' | 'Admitted' | 'Non-Admitted' | 'Answered' | 'Closed';
export type House = 'Lok Sabha' | 'Rajya Sabha';
export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: number;
}
export interface Question {
  id: string;
  title: string;
  body: string;
  division: string;
  status: QuestionStatus;
  attachmentIds: string[];
  createdAt: number;
  createdBy: string; // Mock user ID
  updatedAt: number;
  answer?: string;
  comments?: Comment[];
  memberName: string;
  ticketNumber: string;
  house: House;
}
export interface Attachment {
  id: string;
  questionId: string;
  label: string;
  folderPath: string; // URL/Path to the folder
  division: string;
  createdAt: number;
}
export interface Metrics {
  byStatus: { status: QuestionStatus; count: number }[];
  byDivision: { division: string; count: number }[];
  byHouse?: { house: House; count: number }[];
  totalQuestions: number;
  totalAttachments: number;
}
export interface RecentActivity {
  id: string;
  title: string;
  status: QuestionStatus;
  updatedAt: number;
  ticketNumber: string;
}
export type ExportCSVResponse = string;
export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: number;
  user: string;
}