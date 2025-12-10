import type { User, Chat, ChatMessage, Question, Attachment } from './types';
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
export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    title: 'Inquiry on Vaccine Distribution Logistics in Rural Areas',
    body: 'This question pertains to the current state of vaccine distribution logistics. We need a detailed report on the challenges faced and measures being taken to ensure timely delivery to remote and rural locations across the country. Please include data on cold chain maintenance and last-mile delivery success rates.',
    division: 'Logistics',
    status: 'Answered',
    attachmentIds: ['a1'],
    createdAt: now - 86400000 * 5, // 5 days ago
    createdBy: 'u2',
    updatedAt: now - 86400000 * 2,
  },
  {
    id: 'q2',
    title: 'Status of Clinical Trials for New Antiviral Drug (AV-2024)',
    body: 'Requesting an update on the phase III clinical trials for the new antiviral drug AV-2024. What are the preliminary findings regarding efficacy and safety? When is the expected timeline for regulatory submission?',
    division: 'Clinical Services',
    status: 'Submitted',
    attachmentIds: ['a2', 'a3'],
    createdAt: now - 86400000 * 2, // 2 days ago
    createdBy: 'u2',
    updatedAt: now - 86400000 * 2,
  },
  {
    id: 'q3',
    title: 'Review of Public Health Awareness Campaigns for Dengue Prevention',
    body: 'An assessment is required for the effectiveness of recent public health awareness campaigns on dengue prevention. Please provide metrics on public engagement, and any observed correlation with a reduction in reported cases in campaign areas.',
    division: 'Public Health',
    status: 'Draft',
    attachmentIds: [],
    createdAt: now - 3600000, // 1 hour ago
    createdBy: 'u1',
    updatedAt: now - 3600000,
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