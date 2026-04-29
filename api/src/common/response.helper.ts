export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

export function createResponse<T>(
  data: T,
  message: string,
  statusCode = 200,
): ApiResponse<T> {
  return { data, message, statusCode };
}
