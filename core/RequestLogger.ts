import { randomBytes } from 'crypto';

import { FastifyReply, FastifyRequest } from 'fastify';
import Curler from './Curler';

type Options = {
  showCurl?: boolean;
};

export default class RequestLogger {
  private static sequence: number = 0;

  private id: string;

  private request: FastifyRequest;
  private response: FastifyReply;

  private options: Options;

  private curler: Curler;

  constructor(request: FastifyRequest, response: FastifyReply, options: Options = {}) {
    this.id = this.generateIdentifier();

    this.request = request;
    this.response = response;

    this.options = options;

    if (options.showCurl) this.curler = new Curler();
  }

  getId(): string {
    return this.id;
  }

  private generateIdentifier(): string {
    const sequence = String(++RequestLogger.sequence).padStart(2, '0');
    const random = randomBytes(2).toString('hex');

    return `${random}:${sequence}`;
  }

  private createCurl(): string {
    return this.curler.generateCurl(this.request);
  }

  private logline(...input) {
    console.log(`${this.id} |`, ...input);
  }

  private logRequest() {
    const request = this.request;
    const { method, url, query, headers, body } = request;

    const curl = this.options.showCurl && this.createCurl();

    this.logline(`REQUEST (${this.id}) {`);
    this.logline(`  stamp:   ${new Date().toISOString()}`);
    this.logline(`  method:  ${method}`);
    this.logline(`  url:     ${url}`);
    this.logline(`  query:   ${JSON.stringify(query)}`);
    this.logline(`  headers: ${JSON.stringify(headers)}`);
    this.logline(`  body:    ${body}`);
    this.options.showCurl && this.logline(`  curl: \n${curl}`);
    this.logline('}');
  }

  private logResponse() {
    this.logline(`RESPONSE (${this.id}) {`);
    this.logline(`  status:  200`);
    this.logline(`  headers: { "Content-Type": "application/json" }`);
    this.logline(`  body:    { "ok": true }`);
    this.logline('}');
  }

  public log() {
    this.logRequest();
    this.logResponse();
  }
}
