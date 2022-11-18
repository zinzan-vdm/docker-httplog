import { FastifyRequest } from 'fastify';

export default class Curler {
  generateCurl(request: FastifyRequest): string {
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
}
