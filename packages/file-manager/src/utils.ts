import fs from 'node:fs/promises';
import path from 'node:path';

export const ensureDirectory = async (target: string): Promise<void> => {
  await fs.mkdir(target, { recursive: true });
};

export const sanitizeSlug = (value: string): string => {
  return value.toLowerCase().replace(/[^a-z0-9\-\s_]/g, '').trim().replace(/[\s_]+/g, '-');
};

export const resolveProblemPath = (storageRoot: string, slug: string): string => {
  return path.join(storageRoot, `${slug}.md`);
};
