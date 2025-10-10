export class ProblemNotFoundError extends Error {
  constructor(slug: string) {
    super(`Problem with slug \"${slug}\" was not found`);
    this.name = 'ProblemNotFoundError';
  }
}

export class ProblemTemplateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProblemTemplateValidationError';
  }
}
