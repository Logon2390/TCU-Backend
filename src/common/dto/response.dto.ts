export class ResponseDTO<T = any> {
  success: boolean;
  data?: T;
  message: string;

  constructor(success: boolean, message: string, data?: T) {
    this.success = success;
    this.message = message;
    if (data !== undefined) this.data = data;
  }
} 