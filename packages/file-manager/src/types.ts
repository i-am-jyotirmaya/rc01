import { z } from 'zod';

import type { ProblemTemplateMetadata } from '@rc01/problem-template';

export const problemContentSchema = z.object({
  content: z.string().min(1, 'Problem content is required'),
});

export type ProblemDifficulty = ProblemTemplateMetadata['difficulty'];

export type CreateProblemInput = z.infer<typeof problemContentSchema>;

export type ProblemMetadata = {
  slug: string;
  filename: string;
  title: string;
  difficulty: ProblemDifficulty;
  tags: string[];
  estimatedDurationMinutes?: number;
  author?: string;
  source?: string;
  updatedAt: string;
  hash: string;
};

export type ProblemRecord = ProblemMetadata & { content: string };

export type FileManagerOptions = {
  storageRoot: string;
  databaseFile?: string;
};
