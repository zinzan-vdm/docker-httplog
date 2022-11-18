import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import LogStore from '../core/LogStore';
import RequestLogger from '../core/RequestLogger';

export default (fastify: FastifyInstance, logStore: LogStore) => {
  const {
    SHOW_CURL = 0,
    HEALTH_ENDPOINT = '/health',
    ENABLE_TAIL_UI = 0,
    TAIL_UI_ENDPOINT = '/~/tail',
    ENABLE_WSAPI = ENABLE_TAIL_UI,
    WEBSOCKET_API_ENDPOINT = '/~/ws',
  } = process.env;

  fastify.register(async fastify => {
    fastify.removeAllContentTypeParsers();
    fastify.addContentTypeParser('*', { parseAs: 'string' }, (req, body, done) => done(null, body));

    fastify.addHook('onResponse', (request: FastifyRequest, response: FastifyReply) => {
      if (request.url === HEALTH_ENDPOINT) return;

      if (Number(ENABLE_TAIL_UI) === 1 && request.url.startsWith(TAIL_UI_ENDPOINT)) return;
      if (Number(ENABLE_WSAPI) === 1 && request.url.startsWith(WEBSOCKET_API_ENDPOINT)) return;

      const logger = new RequestLogger(request, response, { showCurl: Number(SHOW_CURL) === 1 });

      logger.log();

      try {
        logStore.log(logger.getId(), new Date(), request, response, '{"ok":true}');
      } catch (e) {
        console.error(e);
      }
    });

    fastify.route({
      method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      url: '/*',
      handler: async (request: FastifyRequest, response: FastifyReply) => {
        response.status(200).send({ ok: true });
      },
    });

    console.log(`Request Logger initialized.`);
  });
};
