import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChatBoardEntity, QuestionEntity, AttachmentEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Question, QuestionStatus, Attachment } from "@shared/types";
import { DIVISIONS } from "@shared/mock-data";
function generateCSV(questions: Question[]): string {
  if (questions.length === 0) return '';
  const headers = ['id', 'title', 'division', 'status', 'createdAt', 'updatedAt', 'body'];
  const csvRows = [
    headers.join(','),
    ...questions.map(q => [
      q.id,
      `"${q.title.replace(/"/g, '""')}"`,
      q.division,
      q.status,
      new Date(q.createdAt).toISOString(),
      new Date(q.updatedAt).toISOString(),
      `"${q.body.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    ].join(','))
  ];
  return csvRows.join('\n');
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'CF Workers Demo' }}));
  // SWASTHYAQ ROUTES
  // GET Divisions
  app.get('/api/divisions', (c) => {
    return ok(c, DIVISIONS);
  });
  // GET Metrics
  app.get('/api/metrics', async (c) => {
    await QuestionEntity.ensureSeed(c.env);
    await AttachmentEntity.ensureSeed(c.env);
    const [questions, attachments] = await Promise.all([
      QuestionEntity.list(c.env, null, 1000).then(p => p.items),
      AttachmentEntity.list(c.env, null, 1000).then(p => p.items),
    ]);
    const byStatus: Record<QuestionStatus, number> = { Draft: 0, Submitted: 0, Answered: 0, Closed: 0 };
    const byDivision: Record<string, number> = {};
    for (const q of questions) {
      byStatus[q.status] = (byStatus[q.status] || 0) + 1;
      byDivision[q.division] = (byDivision[q.division] || 0) + 1;
    }
    return ok(c, {
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status: status as QuestionStatus, count })),
      byDivision: Object.entries(byDivision).map(([division, count]) => ({ division, count })),
      totalQuestions: questions.length,
      totalAttachments: attachments.length,
    });
  });
  // GET Recent Activity
  app.get('/api/recent-activity', async (c) => {
    await QuestionEntity.ensureSeed(c.env);
    const allQuestions = await QuestionEntity.list(c.env, null, 1000).then(p => p.items);
    allQuestions.sort((a, b) => b.updatedAt - a.updatedAt);
    const recent = allQuestions.slice(0, 10);
    return ok(c, recent.map(q => ({ id: q.id, title: q.title, status: q.status, updatedAt: q.updatedAt })));
  });
  // Questions CRUD
  app.get('/api/questions', async (c) => {
    await QuestionEntity.ensureSeed(c.env);
    const { cursor, limit, division, status, search } = c.req.query();
    const page = await QuestionEntity.list(c.env, cursor ?? null, limit ? Math.max(1, (Number(limit) | 0)) : 20);
    let items = page.items;
    if (isStr(division)) items = items.filter(q => q.division === division);
    if (isStr(status)) items = items.filter(q => q.status === status);
    if (isStr(search)) {
      const searchTerm = search.toLowerCase();
      items = items.filter(q => 
        q.title.toLowerCase().includes(searchTerm) || 
        q.body.toLowerCase().includes(searchTerm)
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
  app.get('/api/questions/:id', async (c) => {
    const { id } = c.req.param();
    const question = new QuestionEntity(c.env, id);
    if (!await question.exists()) return notFound(c, 'Question not found');
    return ok(c, await question.getState());
  });
  app.post('/api/questions', async (c) => {
    const { title, body, division } = await c.req.json<Partial<Question>>();
    if (!isStr(title) || !isStr(body) || !isStr(division)) return bad(c, 'title, body, and division are required');
    const now = Date.now();
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      title,
      body,
      division,
      status: 'Draft',
      attachmentIds: [],
      createdAt: now,
      createdBy: 'u1', // Mock user
      updatedAt: now,
    };
    await QuestionEntity.create(c.env, newQuestion);
    return ok(c, newQuestion);
  });
  app.patch('/api/questions/:id', async (c) => {
    const { id } = c.req.param();
    const patch = await c.req.json<Partial<Question>>();
    const question = new QuestionEntity(c.env, id);
    if (!await question.exists()) return notFound(c, 'Question not found');
    await question.mutate(q => ({ ...q, ...patch, id: q.id, updatedAt: Date.now() }));
    return ok(c, await question.getState());
  });
  app.post('/api/questions/bulk-status', async (c) => {
    const { ids, status } = await c.req.json<{ ids: string[], status: QuestionStatus }>();
    if (!Array.isArray(ids) || !isStr(status)) return bad(c, 'ids (array) and status (string) are required');
    const updates = ids.map(id => {
      const question = new QuestionEntity(c.env, id);
      return question.patch({ status, updatedAt: Date.now() });
    });
    await Promise.all(updates);
    return ok(c, { updated: ids.length });
  });
  app.delete('/api/questions/:id', async (c) => {
    const { id } = c.req.param();
    const deleted = await QuestionEntity.delete(c.env, id);
    return ok(c, { id, deleted });
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
    if (!isStr(questionId) || !isStr(label) || !isStr(folderPath) || !isStr(division)) {
      return bad(c, 'questionId, label, folderPath, and division are required');
    }
    const newAttachment = {
      id: crypto.randomUUID(),
      questionId,
      label,
      folderPath,
      division,
      createdAt: Date.now(),
    };
    await AttachmentEntity.create(c.env, newAttachment);
    // Also update the question
    const question = new QuestionEntity(c.env, questionId);
    if (await question.exists()) {
      await question.mutate(q => ({
        ...q,
        attachmentIds: [...q.attachmentIds, newAttachment.id],
      }));
    }
    return ok(c, newAttachment);
  });
  // Admin Routes
  app.post('/api/admin/seed', async (c) => {
    await QuestionEntity.ensureSeed(c.env);
    await AttachmentEntity.ensureSeed(c.env);
    return ok(c, { seeded: true });
  });
}