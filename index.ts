import * as dotenv from 'dotenv';

import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import Helmet from '@fastify/helmet';
import Cors from '@fastify/cors';
import RequestLogger from './core/RequestLogger';

dotenv.config();

const {
  BIND_ADDRESS = '::',
  BIND_PORT = process.env.PORT || 8080,
  HTTP_BODY_LIMIT = 1048576 * 2, // default is 2 MiB
  ENABLE_CORS = 0,
} = process.env;

const fastify = Fastify({
  ignoreTrailingSlash: true,
  caseSensitive: false,
  bodyLimit: Number(HTTP_BODY_LIMIT),
  logger: false,
  frameworkErrors: function (error, req, res) {
    return res.code(500).send();
  },
  pluginTimeout: 5000 || 30000,
});

fastify.register(Helmet, {});

if (Boolean(Number(ENABLE_CORS))) {
  fastify.register(Cors, {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
}

fastify.addContentTypeParser('*', { parseAs: 'string' }, (req, body, done) => done(null, body));

fastify.addHook('onResponse', (request: FastifyRequest, response: FastifyReply) => {
  const logger = new RequestLogger(request, response);

  logger.log();
});

fastify.route({
  method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  url: '/*',
  handler: async (request: FastifyRequest, response: FastifyReply) => {
    response.status(200).send({ ok: true });
  },
});

fastify.listen({ port: Number(BIND_PORT), host: BIND_ADDRESS }, error => {
  if (error) return console.error(error);

  console.log(`HTTPLOG now listening on ${BIND_ADDRESS}:${BIND_PORT}.`);
});
