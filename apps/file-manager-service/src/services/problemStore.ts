import { Dirent } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { z } from 'zod';

import {
  getSlugFromMetadata,
  validateProblemMarkdown,
  type ProblemTemplateMetadata,
} from '@rc01/problem-template';

import { resolveProblemPath, sanitizeSlug } from '../utils/files.js';

const ensureSlug = (value: string): string => {
  const sanitized = sanitizeSlug(value);
  if (!sanitized) {
    throw new Error('Problem slug cannot be empty after sanitization');
  }

  return sanitized;
};

export const createProblemSchema = z.object({
  content: z.string().min(1, 'Problem content is required'),
});

export type CreateProblemInput = z.infer<typeof createProblemSchema>;

export type ProblemMetadata = {
  slug: string;
  filename: string;
  title: string;
  difficulty: ProblemTemplateMetadata['difficulty'];
  tags: string[];
  estimatedDurationMinutes?: number;
  author?: string;
  source?: string;
  updatedAt: string;
  hash: string;
};

export type ProblemRecord = ProblemMetadata & { content: string };

const calculateHash = (payload: string | Buffer): string => {
  return createHash('sha256').update(payload).digest('hex');
};

const mapParsedMetadata = (
  slug: string,
  filename: string,
  updatedAt: string,
  hash: string,
  metadata: ProblemTemplateMetadata,
): ProblemMetadata => ({
  slug,
  filename,
  title: metadata.title,
  difficulty: metadata.difficulty,
  tags: metadata.tags,
  estimatedDurationMinutes: metadata.estimatedDurationMinutes,
  author: metadata.author,
  source: metadata.source,
  updatedAt,
  hash,
});

const extractProblemMetadata = async (
  filePath: string,
  slug: string,
): Promise<{ metadata: ProblemTemplateMetadata; content: string; hash: string; updatedAt: string }> => {
  const [buffer, stats] = await Promise.all([
    fs.readFile(filePath),
    fs.stat(filePath),
  ]);
  const content = buffer.toString('utf-8');
  const validation = validateProblemMarkdown(content);

  if (!validation.isValid || !validation.parsed) {
    throw new Error('Stored problem ' + slug + ' does not match the required template.');
  }

  const hash = calculateHash(buffer);
  return {
    metadata: validation.parsed.metadata,
    content,
    hash,
    updatedAt: stats.mtime.toISOString(),
  };
};

export class ProblemStore {
  constructor(private readonly storageRoot: string) {}

  async list(): Promise<ProblemMetadata[]> {
    const entries: Dirent[] = await fs.readdir(this.storageRoot, { withFileTypes: true });
    const markdownFiles = entries.filter((entry: Dirent) => entry.isFile() && entry.name.endsWith('.md'));

    const stats = await Promise.all(
      markdownFiles.map(async (entry: Dirent): Promise<ProblemMetadata> => {
        const slug = path.basename(entry.name, '.md');
        const filePath = path.join(this.storageRoot, entry.name);
        const { metadata, hash, updatedAt } = await extractProblemMetadata(filePath, slug);

        return mapParsedMetadata(slug, entry.name, updatedAt, hash, metadata);
      }),
    );

    stats.sort((a: ProblemMetadata, b: ProblemMetadata) => a.slug.localeCompare(b.slug));

    return stats;
  }

  async read(slug: string): Promise<ProblemRecord> {
    const sanitized = ensureSlug(slug);
    const filePath = resolveProblemPath(this.storageRoot, sanitized);
    const { metadata, content, hash, updatedAt } = await extractProblemMetadata(filePath, sanitized);

    return {
      ...mapParsedMetadata(sanitized, path.basename(filePath), updatedAt, hash, metadata),
      content,
    };
  }

  async save(input: CreateProblemInput): Promise<ProblemRecord> {
    const validation = validateProblemMarkdown(input.content);

    if (!validation.isValid || !validation.parsed) {
      throw new Error('Problem content does not match the required template.');
    }

    const templateMetadata = validation.parsed.metadata;
    const slug = ensureSlug(getSlugFromMetadata(templateMetadata));
    const filename = slug + '.md';
    const filePath = resolveProblemPath(this.storageRoot, slug);

    await fs.writeFile(filePath, input.content, 'utf-8');
    const stats = await fs.stat(filePath);
    const updatedAt = stats.mtime.toISOString();
    const hash = calculateHash(input.content);

    return {
      ...mapParsedMetadata(slug, filename, updatedAt, hash, templateMetadata),
      content: input.content,
    };
  }

  async delete(slug: string): Promise<void> {
    const sanitized = ensureSlug(slug);
    const filePath = resolveProblemPath(this.storageRoot, sanitized);
    await fs.unlink(filePath);
  }
}
