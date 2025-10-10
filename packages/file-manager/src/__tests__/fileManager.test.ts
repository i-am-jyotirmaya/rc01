import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildProblemTemplate } from '@rc01/problem-template';

import {
  ProblemNotFoundError,
  createFileManager,
  problemContentSchema,
  type ProblemMetadata,
} from '../index.js';

describe('FileManager', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'file-manager-package-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('persists metadata in sqlite and reads markdown content from disk', async () => {
    const manager = await createFileManager({ storageRoot: tempDir });
    const content = buildProblemTemplate({
      title: 'Binary Search',
      difficulty: 'medium',
      tags: ['search'],
    });

    const problem = await manager.saveProblem(problemContentSchema.parse({ content }));

    expect(problem.slug).toBe('binary-search');
    expect(problem.hash).toMatch(/^[a-f0-9]{64}$/);

    const listed: ProblemMetadata[] = await manager.listProblems();
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({
      slug: 'binary-search',
      title: 'Binary Search',
      tags: ['search'],
    });

    const fetched = await manager.getProblem('binary-search');
    expect(fetched.content).toBe(content);

    await manager.deleteProblem('binary-search');
    await expect(manager.getProblem('binary-search')).rejects.toBeInstanceOf(ProblemNotFoundError);

    manager.close();
  });
});
