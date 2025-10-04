import { Dirent } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { z } from 'zod';

import { resolveProblemPath, sanitizeSlug } from '../utils/files';

const ensureSlug = (value: string): string => {
  const sanitized = sanitizeSlug(value);
  if (!sanitized) {
    throw new Error('Problem slug cannot be empty after sanitization');
  }

  return sanitized;
};

export const createProblemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .transform((value) => sanitizeSlug(value))
    .refine((value) => value.length > 0, {
      message: 'Slug must contain at least one alphanumeric character',
    })
    .optional(),
  content: z.string().min(1, 'Problem content is required'),
});

export type CreateProblemInput = z.infer<typeof createProblemSchema>;

export type ProblemMetadata = {
  slug: string;
  filename: string;
  updatedAt: string;
  hash: string;
};

export type ProblemRecord = ProblemMetadata & { content: string };

const calculateHash = (payload: string | Buffer): string => {
  return createHash('sha256').update(payload).digest('hex');
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
        const [info, buffer] = await Promise.all([
          fs.stat(filePath),
          fs.readFile(filePath),
        ]);

        return {
          slug,
          filename: entry.name,
          updatedAt: info.mtime.toISOString(),
          hash: calculateHash(buffer),
        } satisfies ProblemMetadata;
      }),
    );

    stats.sort((a: ProblemMetadata, b: ProblemMetadata) => a.slug.localeCompare(b.slug));

    return stats;
  }

  async read(slug: string): Promise<ProblemRecord> {
    const sanitized = ensureSlug(slug);
    const filePath = resolveProblemPath(this.storageRoot, sanitized);
    const [buffer, stats] = await Promise.all([
      fs.readFile(filePath),
      fs.stat(filePath),
    ]);
    const content = buffer.toString('utf-8');

    return {
      slug: sanitized,
      filename: path.basename(filePath),
      updatedAt: stats.mtime.toISOString(),
      content,
      hash: calculateHash(buffer),
    };
  }

  async save(input: CreateProblemInput): Promise<ProblemRecord> {
    const slug = ensureSlug(input.slug ?? input.title);

    const filename = `${slug}.md`;
    const filePath = resolveProblemPath(this.storageRoot, slug);

    await fs.writeFile(filePath, input.content, 'utf-8');
    const stats = await fs.stat(filePath);

    return {
      slug,
      filename,
      updatedAt: stats.mtime.toISOString(),
      content: input.content,
      hash: calculateHash(input.content),
    };
  }

  async delete(slug: string): Promise<void> {
    const sanitized = ensureSlug(slug);
    const filePath = resolveProblemPath(this.storageRoot, sanitized);
    await fs.unlink(filePath);
  }
}
