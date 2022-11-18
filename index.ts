import * as dotenv from 'dotenv';

import Fastify from 'fastify';
import Helmet from '@fastify/helmet';
import Cors from '@fastify/cors';

import LogStore from './core/LogStore';
import registerRequestLogging from './setup/registerRequestLogging';
import registerWebsocketAPI from './setup/registerWebsocketAPI';
import registerTailView from './setup/registerTailView';

dotenv.config();

const {
  BIND_ADDRESS = '::',
  BIND_PORT = process.env.PORT || 8080,
  HTTP_BODY_LIMIT = 1048576 * 2, // default is 2 MiB
  ENABLE_CORS = 0,
  LOG_RETENTION_SIZE = 0,
} = process.env;

const logStore = new LogStore({ retentionSize: 2 || Number(LOG_RETENTION_SIZE) || 0 });

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

fastify.register(Helmet, {
  contentSecurityPolicy: {
    directives: {
      'script-src': [
        "'self'",
        "'sha256-wLRAqsqG1hglUAlMUduFICYJ2zZKpDiglvU55JVpNl4='", // See: /tail-ui/index.html for script using this CSP hash.
      ],
    },
  },
});

if (Boolean(Number(ENABLE_CORS))) {
  fastify.register(Cors, {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
}

registerWebsocketAPI(fastify, logStore);
registerTailView(fastify);

registerRequestLogging(fastify, logStore);

fastify.listen({ port: Number(BIND_PORT), host: BIND_ADDRESS }, error => {
  if (error) return console.error(error);

  console.log(`HTTPLOG now listening on ${BIND_ADDRESS}:${BIND_PORT}.`);
});
