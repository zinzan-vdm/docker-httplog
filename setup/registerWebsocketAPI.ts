import Websocket, { SocketStream } from '@fastify/websocket';
import { FastifyInstance, FastifyRequest } from 'fastify';
import LogStore, { Log } from '../core/LogStore';

export default (fastify: FastifyInstance, logStore: LogStore) => {
  const { ENABLE_TAIL_UI = 0, ENABLE_WSAPI = ENABLE_TAIL_UI, WEBSOCKET_API_ENDPOINT = '/~/ws' } = process.env;

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
