export interface ErrorResponse {
  code: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}