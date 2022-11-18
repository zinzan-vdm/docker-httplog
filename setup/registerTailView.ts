import { FastifyInstance, FastifyReply } from 'fastify';
import Static from '@fastify/static';
import * as path from 'path';

export default (fastify: FastifyInstance) => {
  let { ENABLE_TAIL_UI = 0, TAIL_UI_ENDPOINT = '/~/tail', TAIL_UI_USER, TAIL_UI_PASSWORD } = process.env;

  if (Number(ENABLE_TAIL_UI) !== 1) return;

  TAIL_UI_ENDPOINT = TAIL_UI_ENDPOINT.replace(/\/{0,1}$/, '');

  fastify.register(async fastify => {
    if (TAIL_UI_USER) {
      let expectedBasic = encodeURIComponent(TAIL_UI_USER) + ':';
      if (TAIL_UI_PASSWORD) expectedBasic += encodeURIComponent(TAIL_UI_PASSWORD);

      expectedBasic = Buffer.from(expectedBasic, 'utf-8').toString('base64');

      function authenticate(basic: string): boolean {
        return basic === expectedBasic;
      }

      function failAuthentication(response: FastifyReply) {
        response
          .header('WWW-Authenticate', 'Basic realm="Tail UI is set to require authentication"')
          .status(401)
          .send('Unauthorized');
      }

      fastify.addHook('onRequest', async (request, response) => {
        if (request.url.startsWith(TAIL_UI_ENDPOINT)) {
          let authorization = request.headers['authorization'] || request.headers['Authorization'];
          Array.isArray(authorization) && (authorization = authorization[0]);

          if (!authorization) {
            failAuthentication(response);
            return;
          }

          const basic = authorization.replace(/Basic\s+/, '');

          if (!authenticate(basic)) {
            failAuthentication(response);
            return;
          }
        }
      });
    }

    fastify.register(Static, {
      root: path.join(__dirname, '..', 'tail-ui'),
      prefix: TAIL_UI_ENDPOINT,
      prefixAvoidTrailingSlash: true,
      wildcard: true,
    });

    fastify.route({
      method: 'GET',
      url: TAIL_UI_ENDPOINT + '/env.json',
      handler: (request, response) => {
        const env = {
          TAIL_UI_ENDPOINT: process.env.TAIL_UI_ENDPOINT || '/~/tail',
          WEBSOCKET_API_ENDPOINT: process.env.WEBSOCKET_API_ENDPOINT || '/~/ws',
        };

        response.status(200).send(env);
      },
    });

    console.log(`Tail UI now enabled and exposed on path ${TAIL_UI_ENDPOINT}.`);
  });
};
