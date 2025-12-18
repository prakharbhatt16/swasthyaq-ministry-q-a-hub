import { Hono } from "hono";
import type { Env as BaseEnv } from './core-utils';
import { UserEntity, QuestionEntity, AttachmentEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Question, QuestionStatus, Attachment, Comment, House } from "@shared/types";
import { DIVISIONS, MOCK_AUDIT_LOGS } from "@shared/mock-data";
import * as xlsx from 'xlsx';
interface Env extends BaseEnv {
  ATTACHMENTS_BUCKET: R2Bucket;
}
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
    return ok(c, allQuestions.slice(0, 10).map(q => ({ id: q.id, title: q.title, status: q.status, updatedAt: q.updatedAt, ticketNumber: q.ticketNumber, tags: q.tags })));
  });
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
      const term = search.toLowerCase();
      items = items.filter(q =>
        q.title.toLowerCase().includes(term) ||
        q.body.toLowerCase().includes(term) ||
        q.ticketNumber.toLowerCase().includes(term) ||
        q.memberName.toLowerCase().includes(term)
      );
    }
    return ok(c, { ...page, items });
  });
  app.get('/api/questions/export-csv', async (c) => {
    const questions = await QuestionEntity.list(c.env, null, 1000).then(p => p.items);
    return ok(c, generateCSV(questions));
  });
  app.post('/api/questions/export-excel', async (c) => {
    const questions = await QuestionEntity.list(c.env, null, 10000).then(p => p.items);
    const attachments = await AttachmentEntity.list(c.env, null, 10000).then(p => p.items);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(questions), 'Questions');
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(attachments), 'Attachments');
    const buf = xlsx.write(wb, { type: 'array', bookType: 'xlsx' });
    return new Response(buf, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="swasthyaq-export.xlsx"` } });
  });
  app.get('/api/questions/:id', async (c) => {
    const q = new QuestionEntity(c.env, c.req.param('id'));
    if (!await q.exists()) return notFound(c);
    return ok(c, await q.getState());
  });
  app.post('/api/questions', async (c) => {
    const body = await c.req.json<Partial<Question>>();
    if (!isStr(body.title) || !isStr(body.division)) return bad(c, 'Missing required fields');
    const id = crypto.randomUUID();
    const now = Date.now();
    const question: Question = {
      ...QuestionEntity.initialState,
      ...body,
      id,
      createdAt: now,
      updatedAt: now,
      status: body.status || 'Draft',
      tags: normalizeTags(body.tags),
    };
    await QuestionEntity.create(c.env, question);
    return ok(c, question);
  });
  app.patch('/api/questions/:id', async (c) => {
    const id = c.req.param('id');
    const patch = await c.req.json<Partial<Question>>();
    const q = new QuestionEntity(c.env, id);
    if (!await q.exists()) return notFound(c);
    const sanitized = { ...patch };
    if (patch.tags) sanitized.tags = normalizeTags(patch.tags);
    const updated = await q.mutate(s => ({ ...s, ...sanitized, id: s.id, updatedAt: Date.now() }));
    return ok(c, updated);
  });
  app.post('/api/questions/bulk-status', async (c) => {
    const { ids, status } = await c.req.json<{ ids: string[], status: QuestionStatus }>();
    if (!Array.isArray(ids) || !status) return bad(c, 'Invalid payload');
    const now = Date.now();
    await Promise.all(ids.map(async id => {
      const q = new QuestionEntity(c.env, id);
      if (await q.exists()) await q.mutate(s => ({ ...s, status, updatedAt: now }));
    }));
    return ok(c, { count: ids.length });
  });
  app.delete('/api/questions/:id', async (c) => {
    const id = c.req.param('id');
    const q = new QuestionEntity(c.env, id);
    if (!await q.exists()) return notFound(c);
    const state = await q.getState();
    if (state.attachmentIds?.length) {
      for (const aid of state.attachmentIds) {
        const att = new AttachmentEntity(c.env, aid);
        const attState = await att.getState();
        if (attState.r2Key && c.env.ATTACHMENTS_BUCKET) await c.env.ATTACHMENTS_BUCKET.delete(attState.r2Key);
        await AttachmentEntity.delete(c.env, aid);
      }
    }
    await QuestionEntity.delete(c.env, id);
    return ok(c, { deleted: true });
  });
  app.get('/api/attachments', async (c) => {
    const { questionId } = c.req.query();
    let list = await AttachmentEntity.list(c.env, null, 1000).then(p => p.items);
    if (isStr(questionId)) list = list.filter(a => a.questionId === questionId);
    return ok(c, list.map(a => ({ ...a, downloadUrl: a.folderPath || `/api/attachments/${a.id}/download` })));
  });
  app.post('/api/attachments', async (c) => {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const questionId = formData.get('questionId') as string;
    const division = formData.get('division') as string;
    if (!isStr(questionId)) return bad(c, 'questionId required');
    const id = crypto.randomUUID();
    const attachment: Attachment = {
      ...AttachmentEntity.initialState,
      id, questionId, division, createdAt: Date.now(),
      label: file?.name || (formData.get('label') as string) || 'Untitled',
    };
    if (file) {
      attachment.filename = file.name;
      attachment.size = file.size;
      attachment.mimeType = file.type;
      if (c.env.ATTACHMENTS_BUCKET) {
        const key = `attachments/${questionId}/${id}-${file.name}`;
        await c.env.ATTACHMENTS_BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
        attachment.r2Key = key;
      }
    } else {
      attachment.folderPath = formData.get('folderPath') as string;
    }
    await AttachmentEntity.create(c.env, attachment);
    const q = new QuestionEntity(c.env, questionId);
    if (await q.exists()) await q.mutate(s => ({ ...s, attachmentIds: [...(s.attachmentIds || []), id] }));
    return ok(c, attachment);
  });
  app.get('/api/attachments/:id/download', async (c) => {
    const att = new AttachmentEntity(c.env, c.req.param('id'));
    if (!await att.exists()) return notFound(c);
    const s = await att.getState();
    // 1. Try R2
    if (s.r2Key && c.env.ATTACHMENTS_BUCKET) {
      const obj = await c.env.ATTACHMENTS_BUCKET.get(s.r2Key);
      if (obj) {
        const headers = new Headers();
        obj.writeHttpMetadata(headers);
        headers.set('Content-Disposition', `attachment; filename="${s.filename || 'file'}"`);
        return new Response(obj.body, { headers });
      }
    }
    // 2. Try Legacy Folder Path
    if (s.folderPath) return c.redirect(s.folderPath);
    // 3. Realistic Mock Fallback
    const mime = s.mimeType || 'text/plain';
    const filename = s.filename || s.label || 'mock-file';
    let body: Uint8Array | string = '';
    let contentType = mime;
    if (mime === 'application/pdf') {
      body = new TextEncoder().encode(`%PDF-1.4\n1 0 obj\n<< /Title (Mock PDF) /Creator (SwasthyaQ) >>\nendobj\n2 0 obj\n<< /Type /Catalog /Pages 3 0 R >>\nendobj\n3 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n4 0 obj\n<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n5 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 100 700 Td (Mock PDF: ${filename}) Tj ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\ntrailer\n<< /Size 6 /Root 2 0 R >>\nstartxref\n310\n%%EOF`);
    } else if (mime.startsWith('image/')) {
      // Minimal 1x1 transparent PNG
      body = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 11, 73, 68, 65, 84, 8, 215, 99, 96, 0, 0, 0, 2, 0, 1, 226, 33, 188, 51, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
    } else if (mime.includes('spreadsheetml') || mime.includes('excel')) {
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet([{ 'Mock Data': 'This is a generated preview file', 'Filename': filename, 'Division': s.division, 'Timestamp': new Date().toISOString() }]), 'Preview');
      body = xlsx.write(wb, { type: 'array', bookType: 'xlsx' });
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      body = `SwasthyaQ Mock File\n-------------------\nFilename: ${filename}\nDivision: ${s.division}\nTimestamp: ${new Date().toISOString()}\n\nThis is a realistic mock file generated because R2 storage is not active in this environment.`;
      contentType = 'text/plain';
    }
    return new Response(body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Mock-Download': 'true',
        'Cache-Control': 'no-cache'
      }
    });
  });
  app.get('/api/tags', async (c) => {
    const qs = await QuestionEntity.list(c.env, null, 1000).then(p => p.items);
    const tags = [...new Set(qs.flatMap(q => q.tags || []))].sort();
    return ok(c, { tags });
  });
  app.post('/api/questions/:id/comments', async (c) => {
    const { text } = await c.req.json<{ text: string }>();
    const q = new QuestionEntity(c.env, c.req.param('id'));
    if (!await q.exists()) return notFound(c);
    const comment: Comment = { id: crypto.randomUUID(), text, author: 'Admin User', createdAt: Date.now() };
    await q.mutate(s => ({ ...s, comments: [...(s.comments || []), comment] }));
    return ok(c, comment);
  });
  app.get('/api/audit-logs', (c) => ok(c, MOCK_AUDIT_LOGS));
  app.post('/api/admin/seed', async (c) => {
    await QuestionEntity.ensureSeed(c.env);
    await AttachmentEntity.ensureSeed(c.env);
    return ok(c, { seeded: true });
  });
}