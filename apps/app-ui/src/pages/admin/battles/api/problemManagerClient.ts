import { getFileManagerAdminToken, getFileManagerBaseUrl } from '../utils/fileManagerConfig';

export interface FileManagerProblemMetadata {
  slug: string;
  filename: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'insane';
  tags: string[];
  estimatedDurationMinutes?: number;
  author?: string;
  source?: string;
  updatedAt: string;
  hash: string;
}

export interface FileManagerProblemRecord extends FileManagerProblemMetadata {
  content: string;
}

const buildHeaders = (): HeadersInit => ({
  Accept: 'application/json',
  'x-admin-token': getFileManagerAdminToken(),
});

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let message = response.statusText || 'Request failed';
    try {
      const data = await response.json();
      if (typeof data?.message === 'string') {
        message = data.message;
      }
    } catch (error) {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
};

export const listProblems = async (): Promise<FileManagerProblemMetadata[]> => {
  const response = await fetch(getFileManagerBaseUrl() + '/problems', {
    method: 'GET',
    headers: buildHeaders(),
  });

  const payload = await handleResponse<{ problems?: FileManagerProblemMetadata[] }>(response);
  return payload.problems ?? [];
};

export const createProblemFromContent = async (content: string): Promise<FileManagerProblemRecord> => {
  const response = await fetch(getFileManagerBaseUrl() + '/problems', {
    method: 'POST',
    headers: {
      ...buildHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  return handleResponse<FileManagerProblemRecord>(response);
};

export const uploadProblemFile = async (file: File): Promise<FileManagerProblemRecord> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(getFileManagerBaseUrl() + '/problems', {
    method: 'POST',
    headers: buildHeaders(),
    body: formData,
  });

  return handleResponse<FileManagerProblemRecord>(response);
};
