import type { User, Chat, ChatMessage, Question, Attachment, Comment, AuditLog } from './types';
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Admin User' },
  { id: 'u2', name: 'Ministry Staff' }
];
export const MOCK_CHATS: Chat[] = [
  { id: 'c1', title: 'General' },
];
export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'm1', chatId: 'c1', userId: 'u1', text: 'Hello', ts: Date.now() },
];
// SwasthyaQ Mock Data
export const DIVISIONS: string[] = ['Epidemiology', 'Clinical Services', 'Pharma', 'Public Health', 'Logistics'];
const now = Date.now();
export const MOCK_COMMENTS: Comment[] = [
  { id: 'c1-q1', text: 'This is a critical inquiry. Please prioritize.', author: 'Dept. Head', createdAt: now - 86400000 * 3 },
  { id: 'c2-q1', text: 'The report is attached, awaiting review.', author: 'Admin User', createdAt: now - 86400000 * 2 },
];
export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    ticketNumber: 'Q-001',
    memberName: 'MP Sharma',
    title: 'Inquiry on Vaccine Distribution Logistics in Rural Areas',
    body: 'This question pertains to the current state of vaccine distribution logistics. We need a detailed report on the challenges faced and measures being taken to ensure timely delivery to remote and rural locations across the country. Please include data on cold chain maintenance and last-mile delivery success rates.',
    division: 'Logistics',
    status: 'Answered',
    attachmentIds: ['a1'],
    createdAt: now - 86400000 * 5, // 5 days ago
    createdBy: 'u2',
    updatedAt: now - 86400000 * 2,
    answer: 'The logistics for vaccine distribution in rural areas have been significantly improved over the last quarter. We have established 50 new cold chain points and partnered with local logistics providers, resulting in a 35% increase in delivery efficiency. The attached report provides a detailed breakdown of the new measures and their impact.',
    comments: MOCK_COMMENTS,
    house: 'Lok Sabha',
  },
  {
    id: 'q2',
    ticketNumber: 'Q-002',
    memberName: 'Dr. Priya Singh',
    title: 'Status of Clinical Trials for New Antiviral Drug (AV-2024)',
    body: 'Requesting an update on the phase III clinical trials for the new antiviral drug AV-2024. What are the preliminary findings regarding efficacy and safety? When is the expected timeline for regulatory submission?',
    division: 'Clinical Services',
    status: 'Submitted',
    attachmentIds: ['a2', 'a3'],
    createdAt: now - 86400000 * 2, // 2 days ago
    createdBy: 'u2',
    updatedAt: now - 86400000 * 2,
    comments: [],
    house: 'Rajya Sabha',
  },
  {
    id: 'q3',
    ticketNumber: 'Q-003',
    memberName: 'Admin User',
    title: 'Review of Public Health Awareness Campaigns for Dengue Prevention',
    body: 'An assessment is required for the effectiveness of recent public health awareness campaigns on dengue prevention. Please provide metrics on public engagement, and any observed correlation with a reduction in reported cases in campaign areas.',
    division: 'Public Health',
    status: 'Draft',
    attachmentIds: [],
    createdAt: now - 3600000, // 1 hour ago
    createdBy: 'u1',
    updatedAt: now - 3600000,
    comments: [],
    house: 'Lok Sabha',
  },
];
export const MOCK_ATTACHMENTS: Attachment[] = [
  {
    id: 'a1',
    questionId: 'q1',
    label: 'Distribution Report Q2 2024.pdf',
    folderPath: 'https://example.com/shared-drive/logistics/q2-report',
    division: 'Logistics',
    createdAt: now - 86400000 * 4,
  },
  {
    id: 'a2',
    questionId: 'q2',
    label: 'Preliminary Trial Data (Internal).xlsx',
    folderPath: 'https://example.com/shared-drive/clinical/av-2024-prelim',
    division: 'Clinical Services',
    createdAt: now - 86400000 * 1,
  },
  {
    id: 'a3',
    questionId: 'q2',
    label: 'Ethics Committee Approval.pdf',
    folderPath: 'https://example.com/shared-drive/clinical/av-2024-ethics',
    division: 'Clinical Services',
    createdAt: now - 86400000 * 1,
  },
];
export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'l1', action: 'CREATE', entity: 'Question', entityId: 'q3', timestamp: now - 3600000, user: 'Admin User' },
  { id: 'l2', action: 'UPDATE', entity: 'Question', entityId: 'q1', timestamp: now - 86400000 * 2, user: 'Ministry Staff' },
  { id: 'l3', action: 'CREATE', entity: 'Attachment', entityId: 'a3', timestamp: now - 86400000 * 1, user: 'Ministry Staff' },
  { id: 'l4', action: 'EXPORT', entity: 'CSV', entityId: 'all', timestamp: now - 1800000, user: 'Admin User' },
];