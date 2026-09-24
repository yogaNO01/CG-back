import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<{ status(code: number): { json(body: unknown): void } }>();
    const request = context.getRequest<{ url: string }>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : undefined;
    const rawMessage = typeof raw === 'object' && raw !== null
      ? (raw as { message?: unknown }).message
      : undefined;
    const message = rawMessage !== undefined
      ? (Array.isArray(rawMessage) ? rawMessage.join('; ') : String(rawMessage))
      : exception instanceof Error ? exception.message : '服务器内部错误';

    response.status(status).json({
      code: status,
      message,
      data: { path: request.url, timestamp: new Date().toISOString() },
    });
  }
}
