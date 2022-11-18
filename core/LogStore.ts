import * as EventEmitter from 'events';

import { FastifyReply, FastifyRequest } from 'fastify';
import Curler from './Curler';

type Options = {
  retentionSize: number;
};

export type Log = {
  identifier: string;
  stamp: Date;
  request: MinifiedRequest;
  response: MinifiedResponse;
};

export type MinifiedRequest = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
  url?: string;
  query?: { [key: string]: string | number | string[] };
  headers?: { [key: string]: string | number | string[] };
  body?: string;
  curl?: string;
};

export type MinifiedResponse = {
  status?: number;
  headers?: { [key: string]: string | number | string[] };
  body?: string;
};

export default class LogStore extends EventEmitter {
  private retentionSize: Options['retentionSize'];

  private logs: Log[];

  private curler: Curler;

  constructor(options: Options) {
    super();

    this.retentionSize = options.retentionSize ? Math.abs(options.retentionSize) : 0;

    this.logs = [];

    this.curler = new Curler();
  }

  private minifyRequest(request: FastifyRequest): MinifiedRequest {
    return {
      method: request.method as MinifiedRequest['method'],
      url: request.url,
      query: request.query as MinifiedRequest['query'],
      headers: request.headers as MinifiedRequest['headers'],
      body: request.body as MinifiedRequest['body'],
      curl: this.curler.generateCurl(request),
    };
  }

  private minifyResponse(response: FastifyReply, body?: string): MinifiedResponse {
    return {
      status: response.statusCode,
      headers: response.getHeaders(),
      body: body,
    };
  }

  private appendLog(log: Log) {
    if (this.retentionSize <= 0) return log;

    if (this.logs.length >= this.retentionSize) {
      this.logs.shift();
    }

    this.logs.push(log);

    return log;
  }

  log(identifier: string, stamp: Date, request: FastifyRequest, response: FastifyReply, responseBody?: string) {
    const log = this.appendLog({
      identifier,
      stamp,
      request: this.minifyRequest(request),
      response: this.minifyResponse(response, responseBody || undefined),
    });

    this.emit('new-log', log);
  }

  getLogHistory(maxLines: number = this.retentionSize): Log[] {
    return this.logs.slice(0, maxLines);
  }
}
