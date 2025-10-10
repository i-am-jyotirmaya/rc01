import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { Express } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildProblemTemplate } from '@rc01/problem-template';

const ADMIN_TOKEN = 'test-admin-token';

const createTestServer = async (): Promise<Express & { cleanup: () => Promise<void> }> => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'file-manager-tests-'));
  process.env.PROBLEM_STORAGE_ROOT = tempDir;
  process.env.FILE_MANAGER_DATABASE_FILE = path.join(tempDir, 'metadata.sqlite');
  process.env.FILE_MANAGER_ADMIN_TOKEN = ADMIN_TOKEN;
  process.env.NODE_ENV = 'test';

  vi.resetModules();
  const { createServer } = await import('../server.js');
  const app = await createServer();

  return Object.assign(app, {
    async cleanup() {
      await rm(tempDir, { recursive: true, force: true });
    },
  });
};

describe('Problem routes', () => {
  let app: Express & { cleanup: () => Promise<void> };

  beforeEach(async () => {
    app = await createTestServer();
  });

  afterEach(async () => {
    await app.cleanup();
    delete process.env.PROBLEM_STORAGE_ROOT;
    delete process.env.FILE_MANAGER_DATABASE_FILE;
    delete process.env.FILE_MANAGER_ADMIN_TOKEN;
    vi.resetModules();
  });

  it('rejects requests without a valid admin token', async () => {
    const [listResponse, invalidResponse] = await Promise.all([
      request(app).get('/problems'),
      request(app).get('/problems').set('x-admin-token', 'wrong-token'),
    ]);

    expect(listResponse.status).toBe(401);
    expect(listResponse.body).toMatchObject({ message: 'Admin authentication required' });
    expect(invalidResponse.status).toBe(401);
    expect(invalidResponse.body).toMatchObject({ message: 'Admin authentication required' });
  });

  it('creates, retrieves, lists, and deletes problems using the markdown template', async () => {
    const content = buildProblemTemplate({
      title: 'Two Sum',
      difficulty: 'easy',
      tags: ['arrays', 'hash-table'],
      estimatedDurationMinutes: 20,
    });
    const expectedHash = createHash('sha256').update(content).digest('hex');

    const createResponse = await request(app)
      .post('/problems')
      .set('x-admin-token', ADMIN_TOKEN)
      .send({ content });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      slug: 'two-sum',
      filename: 'two-sum.md',
      title: 'Two Sum',
      difficulty: 'easy',
      tags: ['arrays', 'hash-table'],
      estimatedDurationMinutes: 20,
      hash: expectedHash,
      content,
    });

    const listResponse = await request(app)
      .get('/problems')
      .set('x-admin-token', ADMIN_TOKEN);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.problems).toEqual([
      expect.objectContaining({
        slug: 'two-sum',
        filename: 'two-sum.md',
        title: 'Two Sum',
        difficulty: 'easy',
        tags: ['arrays', 'hash-table'],
        estimatedDurationMinutes: 20,
        hash: expectedHash,
        updatedAt: createResponse.body.updatedAt,
      }),
    ]);

    const readResponse = await request(app)
      .get('/problems/two-sum')
      .set('x-admin-token', ADMIN_TOKEN);

    expect(readResponse.status).toBe(200);
    expect(readResponse.body).toMatchObject({
      slug: 'two-sum',
      filename: 'two-sum.md',
      title: 'Two Sum',
      difficulty: 'easy',
      tags: ['arrays', 'hash-table'],
      estimatedDurationMinutes: 20,
      hash: expectedHash,
      content,
    });

    const deleteResponse = await request(app)
      .delete('/problems/two-sum')
      .set('x-admin-token', ADMIN_TOKEN);

    expect(deleteResponse.status).toBe(204);

    const missingResponse = await request(app)
      .get('/problems/two-sum')
      .set('x-admin-token', ADMIN_TOKEN);

    expect(missingResponse.status).toBe(404);
  });

  it('supports markdown uploads via multipart form data', async () => {
    const content = buildProblemTemplate({
      title: 'Graph Paths',
      difficulty: 'medium',
      tags: ['graphs'],
    });
    const expectedHash = createHash('sha256').update(content).digest('hex');

    const uploadResponse = await request(app)
      .post('/problems')
      .set('x-admin-token', ADMIN_TOKEN)
      .attach('file', Buffer.from(content, 'utf-8'), 'graph-paths.md');

    expect(uploadResponse.status).toBe(201);
    expect(uploadResponse.body).toMatchObject({
      slug: 'graph-paths',
      filename: 'graph-paths.md',
      hash: expectedHash,
      title: 'Graph Paths',
    });
  });

  it('rejects invalid slugs and malformed templates', async () => {
    const invalidSlugResponse = await request(app)
      .get('/problems/%20%20')
      .set('x-admin-token', ADMIN_TOKEN);

    expect(invalidSlugResponse.status).toBe(400);
    expect(invalidSlugResponse.body).toMatchObject({ message: 'Validation failed' });

    const invalidTemplateResponse = await request(app)
      .post('/problems')
      .set('x-admin-token', ADMIN_TOKEN)
      .send({ content: '# Missing front matter' });

    expect(invalidTemplateResponse.status).toBe(422);
    expect(invalidTemplateResponse.body).toMatchObject({ message: expect.stringMatching(/template/i) });
  });
});
