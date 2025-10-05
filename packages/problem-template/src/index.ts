export type ProblemDifficulty = 'easy' | 'medium' | 'hard' | 'insane';

export interface ProblemTemplateMetadata {
  title: string;
  slug?: string;
  difficulty: ProblemDifficulty;
  tags: string[];
  estimatedDurationMinutes?: number;
  author?: string;
  source?: string;
}

export type ProblemTemplateSectionId =
  | 'statement'
  | 'input'
  | 'output'
  | 'constraints'
  | 'samples'
  | 'notes';

export interface ProblemTemplateSection {
  id: ProblemTemplateSectionId;
  heading: string;
  content: string;
}

export interface ParsedProblemTemplate {
  metadata: ProblemTemplateMetadata;
  sections: Record<ProblemTemplateSectionId, ProblemTemplateSection>;
  markdown: string;
}

export interface ProblemTemplateValidationIssue {
  code:
    | 'metadata_missing'
    | 'metadata_invalid'
    | 'section_missing'
    | 'section_empty'
    | 'section_invalid';
  message: string;
  section?: ProblemTemplateSectionId;
}

export interface ProblemTemplateValidationResult {
  isValid: boolean;
  issues: ProblemTemplateValidationIssue[];
  parsed?: ParsedProblemTemplate;
}

const REQUIRED_SECTIONS: Array<{ id: ProblemTemplateSectionId; heading: string; optional?: boolean }> = [
  { id: 'statement', heading: 'Problem Statement' },
  { id: 'input', heading: 'Input Format' },
  { id: 'output', heading: 'Output Format' },
  { id: 'constraints', heading: 'Constraints' },
  { id: 'samples', heading: 'Sample Tests' },
  { id: 'notes', heading: 'Notes', optional: true },
];

const difficultyValues: ProblemDifficulty[] = ['easy', 'medium', 'hard', 'insane'];

const templatePlaceholder = '<replace-with-value>';
const CODE_FENCE = '\u0060\u0060\u0060';

const sanitizeSlug = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return undefined;
  }

  return trimmed
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[-\s]+/g, '-');
};

const coerceArrayOfStrings = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry !== 'string') {
        return null;
      }

      const trimmed = entry.trim();
      return trimmed ? trimmed : null;
    })
    .filter((entry): entry is string => Boolean(entry));
};

const normalizeScalar = (raw: string): string | number | boolean => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  const quoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('\'') && trimmed.endsWith('\''));
  if (quoted) {
    return trimmed.slice(1, -1);
  }

  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  if (/^(true|false)$/i.test(trimmed)) {
    return trimmed.toLowerCase() === 'true';
  }

  return trimmed;
};

const parseSimpleFrontMatter = (raw: string): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  const lines = raw.split(/\r?\n/);
  let currentArrayKey: string | null = null;

  lines.forEach((line) => {
    if (!line.trim()) {
      currentArrayKey = null;
      return;
    }

    const arrayMatch = line.match(/^\s*-\s*(.*)$/);
    if (arrayMatch && currentArrayKey) {
      const value = arrayMatch[1].trim();
      if (!value) {
        return;
      }

      if (!Array.isArray(result[currentArrayKey])) {
        result[currentArrayKey] = [];
      }

      (result[currentArrayKey] as unknown[]).push(normalizeScalar(value));
      return;
    }

    const match = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (!match) {
      currentArrayKey = null;
      return;
    }

    const key = match[1];
    const value = match[2];

    if (value === '') {
      result[key] = [];
      currentArrayKey = key;
      return;
    }

    currentArrayKey = null;
    result[key] = normalizeScalar(value);
  });

  return result;
};

export const PROBLEM_TEMPLATE_MARKDOWN = [
  '---',
  'title: "' + templatePlaceholder + '"',
  'slug: ""',
  'difficulty: medium',
  'tags:',
  '  - ' + templatePlaceholder,
  'estimatedDurationMinutes: 30',
  'author: ""',
  'source: ""',
  '---',
  '',
  '# ' + templatePlaceholder,
  '',
  '## Problem Statement',
  '',
  'Provide a concise narrative about the challenge, expectations, and scoring.',
  '',
  '## Input Format',
  '',
  'Detail the structure of the input, including number of lines, types, and edge cases.',
  '',
  '## Output Format',
  '',
  'Describe exactly what the program should output.',
  '',
  '## Constraints',
  '',
  '- List any numeric limits, time/memory bounds, or assumptions.',
  '',
  '## Sample Tests',
  '',
  '### Sample 1',
  '',
  '#### Input',
  '',
  CODE_FENCE,
  '<sample input here>',
  CODE_FENCE,
  '',
  '#### Output',
  '',
  CODE_FENCE,
  '<sample output here>',
  CODE_FENCE,
  '',
  '#### Explanation',
  '',
  'Explain how the example maps to the expected output.',
  '',
  '## Notes',
  '',
  'Add clarifying hints, subtasks, or scoring breakdowns if relevant.',
].join('\n');

const parseFrontMatter = (
  markdown: string,
): { metadata: ProblemTemplateMetadata; body: string; issues: ProblemTemplateValidationIssue[] } => {
  const issues: ProblemTemplateValidationIssue[] = [];

  const trimmed = markdown.trimStart();
  if (!trimmed.startsWith('---')) {
    issues.push({ code: 'metadata_missing', message: 'Markdown must start with YAML front matter delimited by ---.' });
    return {
      metadata: {
        title: '',
        difficulty: 'medium',
        tags: [],
      },
      body: markdown,
      issues,
    };
  }

  const frontMatterEnd = trimmed.indexOf('\n---', 3);
  if (frontMatterEnd === -1) {
    issues.push({ code: 'metadata_invalid', message: 'YAML front matter must be closed with ---.' });
    return {
      metadata: {
        title: '',
        difficulty: 'medium',
        tags: [],
      },
      body: markdown,
      issues,
    };
  }

  const rawFrontMatter = trimmed.slice(3, frontMatterEnd + 1);
  const afterFrontMatter = trimmed.slice(frontMatterEnd + 4);

  let data: Record<string, unknown>;
  try {
    data = parseSimpleFrontMatter(rawFrontMatter);
  } catch (error) {
    issues.push({ code: 'metadata_invalid', message: 'Unable to parse YAML front matter.' });
    return {
      metadata: {
        title: '',
        difficulty: 'medium',
        tags: [],
      },
      body: markdown,
      issues,
    };
  }

  const title = data.title;
  const slug = data.slug;
  const difficulty = data.difficulty;
  const tags = data.tags;
  const estimatedDurationMinutes = data.estimatedDurationMinutes;
  const author = data.author;
  const source = data.source;

  if (typeof title !== 'string' || !title.trim()) {
    issues.push({ code: 'metadata_invalid', message: 'Metadata must include a non-empty string "title".' });
  }

  let resolvedDifficulty: ProblemDifficulty = 'medium';
  if (typeof difficulty === 'string') {
    const normalized = difficulty.trim().toLowerCase();
    if (difficultyValues.includes(normalized as ProblemDifficulty)) {
      resolvedDifficulty = normalized as ProblemDifficulty;
    } else {
      issues.push({
        code: 'metadata_invalid',
        message: 'Difficulty must be one of: ' + difficultyValues.join(', ') + '.',
      });
    }
  } else if (difficulty !== undefined) {
    issues.push({ code: 'metadata_invalid', message: 'Difficulty must be a string.' });
  }

  let resolvedSlug = sanitizeSlug(typeof slug === 'string' ? slug : undefined);
  if (!resolvedSlug && typeof title === 'string' && title.trim()) {
    resolvedSlug = sanitizeSlug(title);
  }
  if (!resolvedSlug) {
    issues.push({ code: 'metadata_invalid', message: 'Slug could not be derived from metadata.' });
  }

  let resolvedEstimatedDuration: number | undefined;
  if (estimatedDurationMinutes !== undefined && estimatedDurationMinutes !== null) {
    if (typeof estimatedDurationMinutes === 'number' && Number.isFinite(estimatedDurationMinutes)) {
      if (estimatedDurationMinutes > 0) {
        resolvedEstimatedDuration = Math.round(estimatedDurationMinutes);
      } else {
        issues.push({ code: 'metadata_invalid', message: 'estimatedDurationMinutes must be greater than zero.' });
      }
    } else if (typeof estimatedDurationMinutes === 'string') {
      const numericValue = Number(estimatedDurationMinutes);
      if (Number.isFinite(numericValue) && numericValue > 0) {
        resolvedEstimatedDuration = Math.round(numericValue);
      } else {
        issues.push({ code: 'metadata_invalid', message: 'estimatedDurationMinutes must be a number (minutes).' });
      }
    } else {
      issues.push({
        code: 'metadata_invalid',
        message: 'estimatedDurationMinutes must be a number (minutes).',
      });
    }
  }

  const metadata: ProblemTemplateMetadata = {
    title: typeof title === 'string' ? title.trim() : '',
    slug: resolvedSlug,
    difficulty: resolvedDifficulty,
    tags: coerceArrayOfStrings(tags),
    estimatedDurationMinutes: resolvedEstimatedDuration,
    author: typeof author === 'string' && author.trim() ? author.trim() : undefined,
    source: typeof source === 'string' && source.trim() ? source.trim() : undefined,
  };

  return {
    metadata,
    body: afterFrontMatter.trimStart(),
    issues,
  };
};

const sectionHeadingPattern = /^##\s+(?<heading>.+?)\s*$/gm;

const extractSections = (
  body: string,
): { sections: Record<ProblemTemplateSectionId, ProblemTemplateSection>; issues: ProblemTemplateValidationIssue[] } => {
  const issues: ProblemTemplateValidationIssue[] = [];
  const matches = Array.from(body.matchAll(sectionHeadingPattern));

  if (matches.length === 0) {
    issues.push({
      code: 'section_missing',
      message: 'Markdown must include required section headings.',
    });
    return { sections: {} as Record<ProblemTemplateSectionId, ProblemTemplateSection>, issues };
  }

  const sections: Record<ProblemTemplateSectionId, ProblemTemplateSection> = {} as Record<
    ProblemTemplateSectionId,
    ProblemTemplateSection
  >;

  matches.forEach((match, index) => {
    const heading = match.groups?.heading?.trim();
    if (!heading) {
      return;
    }

    const start = match.index! + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index! : body.length;
    const content = body.slice(start, end).trim();

    const descriptor = REQUIRED_SECTIONS.find((section) => section.heading === heading);
    if (!descriptor) {
      return;
    }

    sections[descriptor.id] = {
      id: descriptor.id,
      heading: descriptor.heading,
      content,
    };
  });

  REQUIRED_SECTIONS.forEach((section) => {
    if (!sections[section.id]) {
      if (!section.optional) {
        issues.push({
          code: 'section_missing',
          message: 'Missing required section "' + section.heading + '".',
          section: section.id,
        });
      }
      return;
    }

    const content = sections[section.id].content;
    if (!content || !content.trim()) {
      issues.push({
        code: 'section_empty',
        message: 'Section "' + section.heading + '" must not be empty.',
        section: section.id,
      });
    }
  });

  const samplesSection = sections.samples;
  if (samplesSection) {
    const hasSampleHeading = /###\s+Sample\s+/i.test(samplesSection.content);
    const hasInputBlock = /####\s+Input/i.test(samplesSection.content);
    const hasOutputBlock = /####\s+Output/i.test(samplesSection.content);

    if (!hasSampleHeading || !hasInputBlock || !hasOutputBlock) {
      issues.push({
        code: 'section_invalid',
        message: 'Sample Tests section must include at least one sample with Input and Output subsections.',
        section: 'samples',
      });
    }
  }

  return { sections, issues };
};

export const validateProblemMarkdown = (markdown: string): ProblemTemplateValidationResult => {
  if (typeof markdown !== 'string') {
    return {
      isValid: false,
      issues: [{ code: 'metadata_invalid', message: 'Markdown payload must be a string.' }],
    };
  }

  const trimmedMarkdown = markdown.trim();
  if (!trimmedMarkdown) {
    return {
      isValid: false,
      issues: [{ code: 'metadata_invalid', message: 'Markdown payload must not be empty.' }],
    };
  }

  const frontMatterResult = parseFrontMatter(trimmedMarkdown);
  const sectionResult = extractSections(frontMatterResult.body);

  const issues = frontMatterResult.issues.concat(sectionResult.issues);
  const isValid = issues.length === 0;

  if (!isValid) {
    return { isValid, issues };
  }

  return {
    isValid,
    issues,
    parsed: {
      metadata: frontMatterResult.metadata,
      sections: sectionResult.sections,
      markdown: trimmedMarkdown,
    },
  };
};

export interface BuildProblemTemplateOptions {
  title?: string;
  difficulty?: ProblemDifficulty;
  tags?: string[];
  estimatedDurationMinutes?: number;
  author?: string;
  source?: string;
}

const toYamlString = (value: string | undefined): string => (value ? value : '');

export const buildProblemTemplate = (options: BuildProblemTemplateOptions = {}): string => {
  const title = options.title && options.title.trim() ? options.title.trim() : 'New Problem Title';
  const difficulty = options.difficulty ?? 'medium';
  const tags = options.tags && options.tags.length ? options.tags : ['algorithm'];
  const estimatedDurationMinutes = options.estimatedDurationMinutes ?? 30;
  const author = options.author?.trim() ?? '';
  const source = options.source?.trim() ?? '';

  const slug = sanitizeSlug(title) ?? 'new-problem-title';

  const lines = [
    '---',
    'title: "' + title.replace(/"/g, '\\"') + '"',
    'slug: "' + slug + '"',
    'difficulty: ' + difficulty,
    'tags:',
    ...(tags.length ? tags.map((tag) => '  - ' + tag) : ['  - algorithm']),
    'estimatedDurationMinutes: ' + estimatedDurationMinutes,
    'author: "' + toYamlString(author) + '"',
    'source: "' + toYamlString(source) + '"',
    '---',
    '',
    '# ' + title,
    '',
    '## Problem Statement',
    '',
    'Provide a concise narrative about the challenge, expectations, and scoring.',
    '',
    '## Input Format',
    '',
    'Detail the structure of the input, including number of lines, types, and edge cases.',
    '',
    '## Output Format',
    '',
    'Describe exactly what the program should output.',
    '',
    '## Constraints',
    '',
    '- List any numeric limits, time/memory bounds, or assumptions.',
    '',
    '## Sample Tests',
    '',
    '### Sample 1',
    '',
    '#### Input',
    '',
    CODE_FENCE,
    '<sample input here>',
    CODE_FENCE,
    '',
    '#### Output',
    '',
    CODE_FENCE,
    '<sample output here>',
    CODE_FENCE,
    '',
    '#### Explanation',
    '',
    'Explain how the example maps to the expected output.',
    '',
    '## Notes',
    '',
    'Add clarifying hints, subtasks, or scoring breakdowns if relevant.',
  ];

  return lines.join('\n');
};

export const getSlugFromMetadata = (metadata: ProblemTemplateMetadata): string => {
  return sanitizeSlug(metadata.slug) ?? sanitizeSlug(metadata.title) ?? 'problem';
};
