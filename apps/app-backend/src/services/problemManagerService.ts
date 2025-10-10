import createHttpError from 'http-errors';

import {
  createFileManager,
  type FileManager,
  type ProblemMetadata as FileManagerProblemMetadata,
  type ProblemRecord as FileManagerProblemRecord,
} from '@rc01/file-manager';

import { env } from '../config/env.js';

export type ProblemMetadata = FileManagerProblemMetadata;
export type ProblemRecord = FileManagerProblemRecord;
export type ProblemDifficulty = ProblemMetadata['difficulty'];

type FileManagerListResponse = { problems?: ProblemMetadata[] };

type FileManagerProblemResponse = ProblemRecord;

type FileManagerErrorResponse = { message?: string };

const buildUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${env.externalServices.fileManager.baseUrl}${normalizedPath}`;
};

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as FileManagerErrorResponse;
    if (data && typeof data.message === 'string') {
      return data.message;
    }
  } catch (error) {
    // ignore JSON parse errors and fall back to status text
  }

  return response.statusText || 'Request failed';
};

const ensureOk = async (response: Response): Promise<void> => {
  if (response.ok) {
    return;
  }

  const message = await readErrorMessage(response);
  throw createHttpError(response.status, message);
};

const fileManagerFetch = async <T>(path: string, init: RequestInit): Promise<T> => {
  const headers = new Headers(init.headers);
  headers.set('x-admin-token', env.externalServices.fileManager.adminToken);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  await ensureOk(response);

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
};

const isPackageMode = env.externalServices.fileManager.mode === 'package';

let packageFileManagerPromise: Promise<FileManager> | null = null;

const getPackageFileManager = (): Promise<FileManager> => {
  if (!packageFileManagerPromise) {
    packageFileManagerPromise = createFileManager({
      storageRoot: env.externalServices.fileManager.storageRoot,
      databaseFile: env.externalServices.fileManager.databaseFile,
    });
  }

  return packageFileManagerPromise;
};

export const listProblems = async (): Promise<ProblemMetadata[]> => {
  if (isPackageMode) {
    const fileManager = await getPackageFileManager();
    return fileManager.listProblems();
  }

  const payload = await fileManagerFetch<FileManagerListResponse>('/problems', {
    method: 'GET',
  });

  return payload.problems ?? [];
};

export const getProblem = async (slug: string): Promise<ProblemRecord> => {
  if (isPackageMode) {
    const fileManager = await getPackageFileManager();
    return fileManager.getProblem(slug);
  }

  return fileManagerFetch<FileManagerProblemResponse>(`/problems/${encodeURIComponent(slug)}`, {
    method: 'GET',
  });
};

export const createProblemFromContent = async (content: string): Promise<ProblemRecord> => {
  if (isPackageMode) {
    const fileManager = await getPackageFileManager();
    return fileManager.saveProblem({ content });
  }

  return fileManagerFetch<FileManagerProblemResponse>('/problems', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });
};

export const uploadProblemFile = async (file: Express.Multer.File): Promise<ProblemRecord> => {
  const content = file.buffer.toString('utf-8');
  if (!content.trim()) {
    throw createHttpError(400, 'Uploaded problem file is empty');
  }

  return createProblemFromContent(content);
};

const deleteProblem = async (slug: string): Promise<void> => {
  if (isPackageMode) {
    const fileManager = await getPackageFileManager();
    await fileManager.deleteProblem(slug);
    return;
  }

  await fileManagerFetch<void>(`/problems/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
  });
};

export const updateProblemFromContent = async (
  slug: string,
  content: string,
): Promise<ProblemRecord> => {
  if (isPackageMode) {
    const fileManager = await getPackageFileManager();
    const problem = await fileManager.saveProblem({ content });

    if (problem.slug !== slug) {
      try {
        await fileManager.deleteProblem(slug);
      } catch (error) {
        // ignore delete failures; the new problem was saved successfully and may have a different slug
      }
    }

    return problem;
  }

  const problem = await createProblemFromContent(content);

  if (problem.slug !== slug) {
    try {
      await deleteProblem(slug);
    } catch (error) {
      // ignore delete failures; the new problem was saved successfully and may have a different slug
    }
  }

  return problem;
};
