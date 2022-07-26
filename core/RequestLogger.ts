import { randomBytes } from 'crypto';

import { FastifyReply, FastifyRequest } from 'fastify';

type Options = {
  showCurl?: boolean;
};

export default class RequestLogger {
  private static sequence: number = 0;

  private id: string;

  private request: FastifyRequest;
  private response: FastifyReply;

  private options: Options;

  constructor(request: FastifyRequest, response: FastifyReply, options: Options = {}) {
    this.id = this.generateIdentifier();

    this.request = request;
    this.response = response;

    this.options = options;
  }

  private generateIdentifier(): string {
    const sequence = String(++RequestLogger.sequence).padStart(2, '0');
    const random = randomBytes(2).toString('hex');

    return `${random}:${sequence}`;
  }

  private createCurl(): string {
    const request = this.request;
    const { method, headers, body } = request;

    const headerOptions = Object.entries(headers).map(([header, value]) => `--header '${header}: ${value}'`);
    const url = request.raw.url;

    let curl = `curl \\\n  --request '${method}' \\\n  --url '${url}'`;

    if (headerOptions.length) {
      curl += ` \\\n  ${headerOptions.join(' \\\n  ')}`;
    }

    if (body) {
      curl += ` \\\n  --data '${body}'`;
    }

    curl = curl.trim();

    return curl;
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
    this.logline(`  status:  200`);
    this.logline(`  res:     {"ok":true}`);
    this.options.showCurl && this.logline(`  curl: \n${curl}`);
    this.logline('}');
  }

  private logResponse() {}

  public log() {
    this.logRequest();
    this.logResponse();
  }
}
