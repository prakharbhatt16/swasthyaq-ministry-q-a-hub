import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChatBoardEntity, QuestionEntity, AttachmentEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Question, QuestionStatus, Attachment, Comment, AuditLog, House } from "@shared/types";
import { DIVISIONS, MOCK_AUDIT_LOGS } from "@shared/mock-data";
import * as xlsx from 'xlsx';
function generateCSV(questions: Question[]): string {
  if (questions.length === 0) return '';
  const headers = ['id', 'ticketNumber', 'memberName', 'house', 'title', 'division', 'status', 'tags', 'createdAt', 'updatedAt', 'body', 'answer'];
  const csvRows = [
    headers.join(','),
    ...questions.map(q => [
      q.id,
      q.ticketNumber,
      `"${q.memberName.replace(/"/g, '""')}"`,
      q.house,
      `"${q.title.replace(/"/g, '""')}"`,
      q.division,
      q.status,
      `"${(q.tags || []).join(', ')}"`,
      new Date(q.createdAt).toISOString(),
      new Date(q.updatedAt).toISOString(),
      `"${q.body.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${(q.answer || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    ].join(','))
  ];
  return csvRows.join('\n');
}
const normalizeTags = (tags: unknown): string[] => {
  if (!Array.isArray(tags)) return [];
  return tags
    .map(t => String(t).toLowerCase().replace(/^#/, '').trim())
    .filter(t => t.length > 0);
};
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'CF Workers Demo' }}));
  // SWASTHYAQ ROUTES
  app.get('/api/divisions', (c) => ok(c, DIVISIONS));
  app.get('/api/metrics', async (c) => {
    await QuestionEntity.ensureSeed(c.env);
    await AttachmentEntity.ensureSeed(c.env);
    const { house, includeTags } = c.req.query();
    let questions = await QuestionEntity.list(c.env, null, 1000).then(p => p.items);
    const attachments = await AttachmentEntity.list(c.env, null, 1000).then(p => p.items);
    if (isStr(house) && (house.toLowerCase() === 'lok sabha' || house.toLowerCase() === 'rajya sabha')) {
      questions = questions.filter(q => q.house.toLowerCase() === house.toLowerCase());
    }
    const byStatus: Record<QuestionStatus, number> = { Draft: 0, Submitted: 0, Admitted: 0, 'Non-Admitted': 0, Answered: 0, Closed: 0 };
    const byDivision: Record<string, number> = {};
    const byHouse: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    for (const q of questions) {
      byStatus[q.status] = (byStatus[q.status] || 0) + 1;
      byDivision[q.division] = (byDivision[q.division] || 0) + 1;
      byHouse[q.house] = (byHouse[q.house] || 0) + 1;
      if (includeTags === 'true' && q.tags) {
        for (const tag of q.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
    }
    const topTags = includeTags === 'true' ? Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag, count]) => ({ tag, count })) : undefined;
    return ok(c, {
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status: status as QuestionStatus, count })),
      byDivision: Object.entries(byDivision).map(([division, count]) => ({ division, count })),
      byHouse: Object.entries(byHouse).map(([house, count]) => ({ house: house as House, count })),
      totalQuestions: questions.length,
      totalAttachments: attachments.length,
      topTags,
    });
  });
  app.get('/api/recent-activity', async (c) => {
    await QuestionEntity.ensureSeed(c.env);
    const allQuestions = await QuestionEntity.list(c.env, null, 1000).then(p => p.items);
    allQuestions.sort((a, b) => b.updatedAt - a.updatedAt);
    const recent = allQuestions.slice(0, 10);
    return ok(c, recent.map(q => ({ id: q.id, title: q.title, status: q.status, updatedAt: q.updatedAt, ticketNumber: q.ticketNumber, tags: q.tags })));
  });
  app.get('/api/tags', async (c) => {
    await QuestionEntity.ensureSeed(c.env);
    const questions = await QuestionEntity.list(c.env, null, 10000).then(p => p.items);
    const allTags = questions.flatMap(q => q.tags || []);
    const uniqueTags = [...new Set(allTags)].sort();
    return ok(c, { tags: uniqueTags });
  });
  // Questions CRUD
  app.get('/api/questions', async (c) => {
    await QuestionEntity.ensureSeed(c.env);
    const { cursor, limit, division, status, search, house, tag } = c.req.query();
    const page = await QuestionEntity.list(c.env, cursor ?? null, limit ? Math.max(1, (Number(limit) | 0)) : 20);
    let items = page.items;
    if (isStr(division)) items = items.filter(q => q.division === division);
    if (isStr(status)) items = items.filter(q => q.status === status);
    if (isStr(house)) items = items.filter(q => q.house.toLowerCase() === house.toLowerCase());
    if (isStr(tag)) items = items.filter(q => q.tags?.includes(tag.toLowerCase()));
    if (isStr(search)) {
      const searchTerm = search.toLowerCase();
      items = items.filter(q =>
        q.title.toLowerCase().includes(searchTerm) ||
        q.body.toLowerCase().includes(searchTerm) ||
        q.ticketNumber.toLowerCase().includes(searchTerm) ||
        q.memberName.toLowerCase().includes(searchTerm) ||
        q.tags?.some(t => t.includes(searchTerm))
      );
    }
    return ok(c, { ...page, items });
  });
  app.get('/api/questions/export-csv', async (c) => {
    await QuestionEntity.ensureSeed(c.env);
    const questions = await QuestionEntity.list(c.env, null, 1000).then(p => p.items);
    const csv = generateCSV(questions);
    return c.text(csv, 200, { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="questions-${Date.now()}.csv"` });
  });
  app.post('/api/questions/export-excel', async (c) => {
    await QuestionEntity.ensureSeed(c.env);
    const questions = await QuestionEntity.list(c.env, null, 10000).then(p => p.items);
    const attachments = await AttachmentEntity.list(c.env, null, 10000).then(p => p.items);
    const qSheet = xlsx.utils.json_to_sheet(questions.map(q => ({ ...q, tags: (q.tags || []).join(', '), inlineAttachments: JSON.stringify(q.inlineAttachments || []) })));
    const aSheet = xlsx.utils.json_to_sheet(attachments);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, qSheet, 'Questions');
    xlsx.utils.book_append_sheet(wb, aSheet, 'Attachments');
    const buf = xlsx.write(wb, { type: 'array', bookType: 'xlsx' });
    return new Response(buf, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="questions-${Date.now()}.xlsx"` } });
  });
  app.get('/api/questions/:id', async (c) => {
    const { id } = c.req.param();
    const question = new QuestionEntity(c.env, id);
    if (!await question.exists()) return notFound(c, 'Question not found');
    return ok(c, await question.getState());
  });
  app.post('/api/questions', async (c) => {
    const { title, body, division, memberName, house, tags, ticketNumber: customTicket } = await c.req.json<Partial<Question>>();
    if (!isStr(title) || !isStr(body) || !isStr(division) || !isStr(memberName) || !isStr(house)) return bad(c, 'title, body, division, memberName, and house are required');
    let ticketNumber = customTicket;
    if (!ticketNumber) {
      const allQuestions = await QuestionEntity.list(c.env, null, 10000);
      const nextId = allQuestions.items.length + 1;
      ticketNumber = `Q-${String(nextId).padStart(3, '0')}`;
    }
    const now = Date.now();
    const newQuestion: Question = {
      id: crypto.randomUUID(), ticketNumber, memberName, title, body, division, house, status: 'Draft', attachmentIds: [], createdAt: now, createdBy: 'u1', updatedAt: now, comments: [], tags: normalizeTags(tags), inlineAttachments: [],
    };
    await QuestionEntity.create(c.env, newQuestion);
    return ok(c, newQuestion);
  });
  app.patch('/api/questions/:id', async (c) => {
    const { id } = c.req.param();
    const rawPatch = await c.req.json<Partial<Question>>();
    const question = new QuestionEntity(c.env, id);
    if (!await question.exists()) return notFound(c, 'Question not found');
    const { tags, ...rest } = rawPatch as Partial<Question>;
    const sanitized = { ...rest };
    if (tags !== undefined) {
      sanitized.tags = normalizeTags(tags);
    }
    await question.mutate(q => ({ ...q, ...sanitized, id: q.id, updatedAt: Date.now() }));
    return ok(c, await question.getState());
  });
  app.post('/api/questions/bulk-status', async (c) => {
    const { ids, status } = await c.req.json<{ ids: string[], status: QuestionStatus }>();
    if (!Array.isArray(ids) || !isStr(status)) return bad(c, 'ids (array) and status (string) are required');
    const updates = ids.map(id => new QuestionEntity(c.env, id).patch({ status, updatedAt: Date.now() }));
    await Promise.all(updates);
    return ok(c, { updated: ids.length });
  });
  app.delete('/api/questions/:id', async (c) => {
    const { id } = c.req.param();
    const question = new QuestionEntity(c.env, id);
    if (await question.exists()) {
      const state = await question.getState();
      // Cascading delete of attachments
      if (state.attachmentIds && state.attachmentIds.length > 0) {
        await AttachmentEntity.deleteMany(c.env, state.attachmentIds);
      }
      await QuestionEntity.delete(c.env, id);
      return ok(c, { id, deleted: true });
    }
    return notFound(c, 'Question not found');
  });
  // Comments
  app.get('/api/questions/:id/comments', async (c) => {
    const { id } = c.req.param();
    const question = new QuestionEntity(c.env, id);
    if (!await question.exists()) return notFound(c, 'Question not found');
    const state = await question.getState();
    return ok(c, state.comments || []);
  });
  app.post('/api/questions/:id/comments', async (c) => {
    const { id } = c.req.param();
    const { text } = await c.req.json<{ text: string }>();
    if (!isStr(text)) return bad(c, 'text is required');
    const question = new QuestionEntity(c.env, id);
    if (!await question.exists()) return notFound(c, 'Question not found');
    const newComment: Comment = { id: crypto.randomUUID(), text, author: 'Admin User', createdAt: Date.now() };
    await question.mutate(q => ({ ...q, comments: [...(q.comments || []), newComment] }));
    return ok(c, newComment);
  });
  // Attachments CRUD
  app.get('/api/attachments', async (c) => {
    await AttachmentEntity.ensureSeed(c.env);
    const { questionId } = c.req.query();
    const allAttachments = await AttachmentEntity.list(c.env, null, 1000).then(p => p.items);
    if (isStr(questionId)) {
      const filtered = allAttachments.filter(a => a.questionId === questionId);
      return ok(c, filtered);
    }
    return ok(c, allAttachments);
  });
  app.post('/api/attachments', async (c) => {
    const { questionId, label, folderPath, division } = await c.req.json<Partial<Attachment>>();
    if (!isStr(questionId) || !isStr(label) || !isStr(folderPath) || !isStr(division)) return bad(c, 'questionId, label, folderPath, and division are required');
    const newAttachment = { id: crypto.randomUUID(), questionId, label, folderPath, division, createdAt: Date.now() };
    await AttachmentEntity.create(c.env, newAttachment);
    const question = new QuestionEntity(c.env, questionId);
    if (await question.exists()) {
      await question.mutate(q => ({ ...q, attachmentIds: [...q.attachmentIds, newAttachment.id] }));
    }
    return ok(c, newAttachment);
  });
  app.delete('/api/attachments/:id', async (c) => {
    const { id } = c.req.param();
    const attachment = new AttachmentEntity(c.env, id);
    if (!await attachment.exists()) return notFound(c, 'Attachment not found');
    const state = await attachment.getState();
    const questionId = state.questionId;
    await AttachmentEntity.delete(c.env, id);
    // Sync parent question
    const question = new QuestionEntity(c.env, questionId);
    if (await question.exists()) {
      await question.mutate(q => ({
        ...q,
        attachmentIds: (q.attachmentIds || []).filter(aid => aid !== id),
        inlineAttachments: (q.inlineAttachments || []).filter(ia => ia.attachmentId !== id)
      }));
    }
    return ok(c, { id, deleted: true });
  });
  // Admin Routes
  app.post('/api/admin/seed', async (c) => {
    await QuestionEntity.ensureSeed(c.env);
    await AttachmentEntity.ensureSeed(c.env);
    return ok(c, { seeded: true });
  });
  app.get('/api/audit-logs', async (c) => ok(c, MOCK_AUDIT_LOGS.sort((a, b) => b.timestamp - a.timestamp)));
}