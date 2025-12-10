/**
 * Minimal real-world demo: One Durable Object instance per entity (User, ChatBoard), with Indexes for listing.
 */
import { IndexedEntity } from "./core-utils";
import type { User, Chat, ChatMessage, Question, Attachment } from "@shared/types";
import { MOCK_CHAT_MESSAGES, MOCK_CHATS, MOCK_USERS, MOCK_QUESTIONS, MOCK_ATTACHMENTS } from "@shared/mock-data";
// USER ENTITY: one DO instance per user
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "" };
  static seedData = MOCK_USERS;
}
// CHAT BOARD ENTITY: one DO instance per chat board, stores its own messages
export type ChatBoardState = Chat & { messages: ChatMessage[] };
const SEED_CHAT_BOARDS: ChatBoardState[] = MOCK_CHATS.map(c => ({
  ...c,
  messages: MOCK_CHAT_MESSAGES.filter(m => m.chatId === c.id),
}));
export class ChatBoardEntity extends IndexedEntity<ChatBoardState> {
  static readonly entityName = "chat";
  static readonly indexName = "chats";
  static readonly initialState: ChatBoardState = { id: "", title: "", messages: [] };
  static seedData = SEED_CHAT_BOARDS;
  async listMessages(): Promise<ChatMessage[]> {
    const { messages } = await this.getState();
    return messages;
  }
  async sendMessage(userId: string, text: string): Promise<ChatMessage> {
    const msg: ChatMessage = { id: crypto.randomUUID(), chatId: this.id, userId, text, ts: Date.now() };
    await this.mutate(s => ({ ...s, messages: [...s.messages, msg] }));
    return msg;
  }
}
// SWASTHYAQ ENTITIES
// QUESTION ENTITY
export class QuestionEntity extends IndexedEntity<Question> {
  static readonly entityName = "question";
  static readonly indexName = "questions";
  static readonly initialState: Question = {
    id: "",
    title: "",
    body: "",
    division: "",
    status: "Draft",
    attachmentIds: [],
    createdAt: 0,
    createdBy: "",
    updatedAt: 0,
    memberName: "",
    ticketNumber: "",
  };
  static seedData = MOCK_QUESTIONS;
}
// ATTACHMENT ENTITY
export class AttachmentEntity extends IndexedEntity<Attachment> {
  static readonly entityName = "attachment";
  static readonly indexName = "attachments";
  static readonly initialState: Attachment = {
    id: "",
    questionId: "",
    label: "",
    folderPath: "",
    division: "",
    createdAt: 0,
  };
  static seedData = MOCK_ATTACHMENTS;
}