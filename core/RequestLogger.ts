import { randomBytes } from 'crypto';

import { FastifyReply, FastifyRequest } from 'fastify';

export default class RequestLogger {
  private static sequence: number = 0;

  private id: string;

  private request: FastifyRequest;
  private response: FastifyReply;

  constructor(request: FastifyRequest, response: FastifyReply) {
    this.id = this.generateIdentifier();

    this.request = request;
    this.response = response;
  }

  private generateIdentifier(): string {
    const sequence = String(++RequestLogger.sequence).padStart(2, '0');
    const random = randomBytes(2).toString('hex');

    return `${random}:${sequence}`;
  }

  private logline(...input) {
    console.log(`${this.id} |`, ...input);
  }

  private logRequest() {
    const request = this.request;
    const { method, url, query, headers, body } = request;

    this.logline(`REQUEST (${this.id}) {`);
    this.logline(`  stamp:   ${new Date().toISOString()}`);
    this.logline(`  method:  ${method}`);
    this.logline(`  url:     ${url}`);
    this.logline(`  query:   ${JSON.stringify(query)}`);
    this.logline(`  headers: ${JSON.stringify(headers)}`);
    this.logline(`  body:    ${body}`);
    this.logline(`  status:  200`);
    this.logline(`  res:     {"ok":true}`);
    this.logline('}');
  }

  private logResponse() {}

  public log() {
    this.logRequest();
    this.logResponse();
  }
}
