import fs from 'node:fs/promises';
import { Dirent } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

import { resolveProblemPath, sanitizeSlug } from '../utils/files';

export type ProblemMetadata = {
  slug: string;
  filename: string;
  updatedAt: string;
};

const createProblemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z
    .string()
    .optional()
    .transform((value) => (value ? sanitizeSlug(value) : undefined)),
  content: z.string().min(1, 'Problem content is required'),
});

export type CreateProblemInput = z.infer<typeof createProblemSchema>;

export class ProblemStore {
  constructor(private readonly storageRoot: string) {}

  async list(): Promise<ProblemMetadata[]> {
    const entries: Dirent[] = await fs.readdir(this.storageRoot, { withFileTypes: true });

    const markdownFiles = entries.filter((entry: Dirent) => entry.isFile() && entry.name.endsWith('.md'));

    const stats = await Promise.all(
      markdownFiles.map(async (entry: Dirent): Promise<ProblemMetadata> => {
        const slug = path.basename(entry.name, '.md');
        const filePath = path.join(this.storageRoot, entry.name);
        const info = await fs.stat(filePath);

        return {
          slug,
          filename: entry.name,
          updatedAt: info.mtime.toISOString(),
        } satisfies ProblemMetadata;
      }),
    );

    stats.sort((a: ProblemMetadata, b: ProblemMetadata) => a.slug.localeCompare(b.slug));

    return stats;
  }

  async read(slug: string): Promise<{ slug: string; content: string }> {
    const sanitized = sanitizeSlug(slug);
    const filePath = resolveProblemPath(this.storageRoot, sanitized);
    const buffer = await fs.readFile(filePath);

    return {
      slug: sanitized,
      content: buffer.toString('utf-8'),
    };
  }

  async save(input: CreateProblemInput): Promise<ProblemMetadata & { content: string }> {
    const parsed = createProblemSchema.parse(input);
    const slug = parsed.slug ?? sanitizeSlug(parsed.title);
    if (!slug) {
      throw new Error('Problem slug cannot be empty after sanitization');
    }

    const filename = `${slug}.md`;
    const filePath = resolveProblemPath(this.storageRoot, slug);

    await fs.writeFile(filePath, parsed.content, 'utf-8');
    const stats = await fs.stat(filePath);

    return {
      slug,
      filename,
      updatedAt: stats.mtime.toISOString(),
      content: parsed.content,
    };
  }
}
