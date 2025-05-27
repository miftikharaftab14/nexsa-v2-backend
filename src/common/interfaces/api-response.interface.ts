export interface ApiResponse<T> {
  success: boolean;
  message: string;
  status: number;
  data: T;
  error?: {
    code: string;
    details?: any;
  };
}
