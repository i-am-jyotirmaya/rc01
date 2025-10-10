import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import Database from 'better-sqlite3';
import type { Database as SQLiteDatabase, Statement } from 'better-sqlite3';

import {
  getSlugFromMetadata,
  validateProblemMarkdown,
  type ProblemTemplateMetadata,
} from '@rc01/problem-template';

import { ProblemNotFoundError, ProblemTemplateValidationError } from './errors.js';
import {
  type CreateProblemInput,
  type FileManagerOptions,
  type ProblemMetadata,
  type ProblemRecord,
} from './types.js';
import { ensureDirectory, resolveProblemPath, sanitizeSlug } from './utils.js';

const ensureSlug = (value: string): string => {
  const sanitized = sanitizeSlug(value);
  if (!sanitized) {
    throw new ProblemTemplateValidationError('Problem slug cannot be empty after sanitization');
  }

  return sanitized;
};

const calculateHash = (payload: string | Buffer): string => {
  return createHash('sha256').update(payload).digest('hex');
};

type ProblemRow = {
  slug: string;
  filename: string;
  title: string;
  difficulty: string;
  tags: string;
  estimated_duration_minutes: number | null;
  author: string | null;
  source: string | null;
  updated_at: string;
  hash: string;
};

const parseTags = (value: string): string[] => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed.filter((tag) => typeof tag === 'string') as string[]) : [];
  } catch (_error) {
    return [];
  }
};

const mapRowToMetadata = (row: ProblemRow): ProblemMetadata => ({
  slug: row.slug,
  filename: row.filename,
  title: row.title,
  difficulty: row.difficulty as ProblemMetadata['difficulty'],
  tags: parseTags(row.tags),
  estimatedDurationMinutes: row.estimated_duration_minutes ?? undefined,
  author: row.author ?? undefined,
  source: row.source ?? undefined,
  updatedAt: row.updated_at,
  hash: row.hash,
});

const defaultDatabaseFile = (storageRoot: string): string => {
  return path.join(storageRoot, 'file-manager.sqlite');
};

export class FileManager {
  private readonly selectAllStatement: Statement;
  private readonly selectOneStatement: Statement;
  private readonly upsertStatement: Statement;
  private readonly deleteStatement: Statement;

  private constructor(
    private readonly storageRoot: string,
    private readonly database: SQLiteDatabase,
  ) {
    this.database.pragma('journal_mode = WAL');
    this.database.pragma('foreign_keys = ON');
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS problems (
        slug TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        title TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        tags TEXT NOT NULL,
        estimated_duration_minutes INTEGER,
        author TEXT,
        source TEXT,
        updated_at TEXT NOT NULL,
        hash TEXT NOT NULL
      )
    `);

    this.selectAllStatement = this.database.prepare(`
      SELECT slug, filename, title, difficulty, tags, estimated_duration_minutes, author, source, updated_at, hash
      FROM problems
      ORDER BY slug ASC
    `);

    this.selectOneStatement = this.database.prepare(`
      SELECT slug, filename, title, difficulty, tags, estimated_duration_minutes, author, source, updated_at, hash
      FROM problems
      WHERE slug = ?
    `);

    this.upsertStatement = this.database.prepare(`
      INSERT INTO problems (slug, filename, title, difficulty, tags, estimated_duration_minutes, author, source, updated_at, hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        filename = excluded.filename,
        title = excluded.title,
        difficulty = excluded.difficulty,
        tags = excluded.tags,
        estimated_duration_minutes = excluded.estimated_duration_minutes,
        author = excluded.author,
        source = excluded.source,
        updated_at = excluded.updated_at,
        hash = excluded.hash
    `);

    this.deleteStatement = this.database.prepare(`
      DELETE FROM problems
      WHERE slug = ?
    `);
  }

  static async create(options: FileManagerOptions): Promise<FileManager> {
    const storageRoot = options.storageRoot;
    const databaseFile = options.databaseFile ?? defaultDatabaseFile(storageRoot);

    await ensureDirectory(storageRoot);
    await ensureDirectory(path.dirname(databaseFile));

    const db = new Database(databaseFile);

    return new FileManager(storageRoot, db);
  }

  async listProblems(): Promise<ProblemMetadata[]> {
    const rows = this.selectAllStatement.all() as ProblemRow[];
    return rows.map((row: ProblemRow) => mapRowToMetadata(row));
  }

  async getProblem(slug: string): Promise<ProblemRecord> {
    const sanitized = ensureSlug(slug);
    const row = this.selectOneStatement.get(sanitized) as ProblemRow | undefined;

    if (!row) {
      throw new ProblemNotFoundError(sanitized);
    }

    const filePath = resolveProblemPath(this.storageRoot, sanitized);

    try {
      const buffer = await fs.readFile(filePath);
      const content = buffer.toString('utf-8');

      return {
        ...mapRowToMetadata(row),
        content,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new ProblemNotFoundError(sanitized);
      }

      throw error;
    }
  }

  async saveProblem(input: CreateProblemInput): Promise<ProblemRecord> {
    const validation = validateProblemMarkdown(input.content);

    if (!validation.isValid || !validation.parsed) {
      throw new ProblemTemplateValidationError('Problem content does not match the required template.');
    }

    const templateMetadata: ProblemTemplateMetadata = validation.parsed.metadata;
    const slug = ensureSlug(getSlugFromMetadata(templateMetadata));
    const filename = `${slug}.md`;
    const filePath = resolveProblemPath(this.storageRoot, slug);

    await fs.writeFile(filePath, input.content, 'utf-8');
    const updatedAt = new Date().toISOString();
    const hash = calculateHash(input.content);

    this.upsertStatement.run(
      slug,
      filename,
      templateMetadata.title,
      templateMetadata.difficulty,
      JSON.stringify(templateMetadata.tags ?? []),
      templateMetadata.estimatedDurationMinutes ?? null,
      templateMetadata.author ?? null,
      templateMetadata.source ?? null,
      updatedAt,
      hash,
    );

    return {
      ...mapRowToMetadata({
        slug,
        filename,
        title: templateMetadata.title,
        difficulty: templateMetadata.difficulty,
        tags: JSON.stringify(templateMetadata.tags ?? []),
        estimated_duration_minutes: templateMetadata.estimatedDurationMinutes ?? null,
        author: templateMetadata.author ?? null,
        source: templateMetadata.source ?? null,
        updated_at: updatedAt,
        hash,
      }),
      content: input.content,
    };
  }

  async deleteProblem(slug: string): Promise<void> {
    const sanitized = ensureSlug(slug);
    const row = this.selectOneStatement.get(sanitized) as ProblemRow | undefined;

    if (!row) {
      throw new ProblemNotFoundError(sanitized);
    }

    const filePath = resolveProblemPath(this.storageRoot, sanitized);

    this.deleteStatement.run(sanitized);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  close(): void {
    this.database.close();
  }
}

export const createFileManager = async (options: FileManagerOptions): Promise<FileManager> => {
  return FileManager.create(options);
};
