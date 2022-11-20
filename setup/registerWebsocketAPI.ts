import Websocket, { SocketStream } from '@fastify/websocket';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import LogStore, { Log } from '../core/LogStore';

export default (fastify: FastifyInstance, logStore: LogStore) => {
  const {
    ENABLE_TAIL_UI = 0,
    ENABLE_WSAPI = ENABLE_TAIL_UI,
    WEBSOCKET_API_ENDPOINT = '/~/ws',
    TAIL_UI_USER,
    WSAPI_USER = TAIL_UI_USER,
    TAIL_UI_PASSWORD,
    WSAPI_PASSWORD = TAIL_UI_PASSWORD,
  } = process.env;

  if (Number(ENABLE_WSAPI) !== 1) return;

  fastify.register(Websocket, {});
  fastify.register(async fastify => {
    function sendPayload(socket: SocketStream['socket'], event: string, data?: any) {
      const payload = JSON.stringify({
        event,
        data,
      });

      socket.send(payload);
    }

    function parsePayload(message: string): { event: string; data?: any } {
      let payload: { event: string; data: any } = null;

      try {
        payload = JSON.parse(message);
      } catch (e) {
        return null;
      }

      if (!payload.event) return null;

      payload.data = payload.data === undefined || payload.data === null ? {} : payload.data;

      return payload;
    }

    if (WSAPI_USER) {
      let expectedBasic = WSAPI_USER + ':';
      if (WSAPI_PASSWORD) expectedBasic += WSAPI_PASSWORD;

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
        if (request.url.startsWith(WEBSOCKET_API_ENDPOINT)) {
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

    fastify.get(
      WEBSOCKET_API_ENDPOINT,
      { websocket: true },
      async (connection: SocketStream, request: FastifyRequest) => {
        const { socket } = connection;
        const state = {
          listeners: {},
        };

        socket.on('message', message => {
          const payload = parsePayload(message);

          if (!payload) return;

          if (payload.event === 'read://log/history') {
            const maxLines = payload.data.max;

            const logs = logStore.getLogHistory(maxLines);

            sendPayload(socket, 'read://log/history', { logs });
            return;
          }

          if (payload.event === 'on://log/event/new-log') {
            if (state.listeners['on://log/event/new-log']) return;

            const listener = (log: Log) => sendPayload(socket, 'event://log/event/new-log', { log });

            logStore.on('new-log', listener);

            state.listeners['on://log/event/new-log'] = listener;
            return;
          }

          if (payload.event === 'off://log/event/new-log') {
            if (!state.listeners['on://log/event/new-log']) return;

            logStore.off('new-log', state.listeners['on://log/event/new-log']);

            delete state.listeners['on://log/event/new-log'];
            return;
          }
        });
      }
    );

    console.log(`WebSocket API now enabled and exposed on path ${WEBSOCKET_API_ENDPOINT}.`);
  });
};
