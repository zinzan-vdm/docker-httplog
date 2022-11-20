import EventBasedApplication from './util/EventBasedApplication.js';
import EventEmitter from './util/EventEmitter.js';

import Renderer from './util/Renderer.js';

import LoadingPage from './pages/loading/loading.js';
import ErrorPage from './pages/error/error.js';
import LogsPage from './pages/logs/logs.js';

const app = new EventBasedApplication();
window.app = app;

const renderer = new Renderer({
  el: '#root',
  app: app,
});

const pages = {
  loading: new LoadingPage(),
  error: new ErrorPage(),
  logs: new LogsPage(),
};

app.register('core://init', async app => {
  app.run('page://loading');

  await app.run('provider://env');
  await app.run('websocket://init');

  app.run('page-events://logs/refresh');
});

app.register('websocket://init', async app => {
  const socketEvents = new EventEmitter();

  const stateWebsocket = {
    ready: false,
    on: (event, listener) => socketEvents.on(event, listener),
    off: (event, listener) => socketEvents.off(event, listener),
    emit: (event, data) => socketEvents.emit(event, data),
    send: (event, data) => stateWebsocket._.sendPayload(event, data),
    _: {
      socket: null,
      parsePayload(message) {
        let payload = null;

        try {
          payload = JSON.parse(message);
        } catch (e) {
          return null;
        }

        if (!payload.event) return null;

        payload.data = payload.data === undefined || payload.data === null ? {} : payload.data;

        return payload;
      },
      sendPayload(event, data = {}) {
        const payload = JSON.stringify({
          event,
          data,
        });

        stateWebsocket._.socket.send(payload);
      },
      reconnect() {
        setTimeout(() => app.run('websocket://connect'), 2000);
      },
    },
  };

  app.set('websocket', stateWebsocket);

  await app.run('websocket://register-listeners');
  await app.run('websocket://connect');
});

app.register('websocket://connect', async app => {
  const env = app.get('env', { WEBSOCKET_API_ENDPOINT: '../ws' });

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const path = env.WEBSOCKET_API_ENDPOINT.replace(/^\//, '');

  const stateWebsocket = app.get('websocket');

  stateWebsocket._.socket = new WebSocket(`${protocol}//${host}/${path}`);

  stateWebsocket._.socket.addEventListener('open', () => {
    stateWebsocket.emit('socket://open');
    stateWebsocket.ready = true;
    stateWebsocket.emit('socket://ready');
  });

  stateWebsocket._.socket.addEventListener('message', message => {
    const payload = stateWebsocket._.parsePayload(message.data);

    if (!payload) {
      console.error('WS: Message received but payload was parsed to null:', { message: message.data, payload });
      return;
    }

    stateWebsocket.emit(payload.event, payload.data);
  });

  stateWebsocket._.socket.addEventListener('close', () => {
    stateWebsocket._.reconnect();

    stateWebsocket.emit('socket://close');
    stateWebsocket.ready = false;
  });
  stateWebsocket._.socket.addEventListener('error', () => {
    stateWebsocket._.reconnect();

    stateWebsocket.emit('socket://close');
    stateWebsocket.ready = false;
  });
});

app.register('websocket://register-listeners', async app => {
  const websocket = app.get('websocket');

  websocket.on('read://log/history', ({ logs = [] }) => {
    app.run('page-events://logs/clear');

    for (let log of logs) {
      app.run('page-events://logs/append-log', { log });
    }

    app.run('page://logs');
  });

  websocket.on('event://log/event/new-log', ({ log }) => {
    app.run('page-events://logs/append-log', { log });
  });
});

app.register('provider://env', async app => {
  const response = await fetch('env.json');

  if (!response.ok) {
    app.run('page://error/provider', { message: 'Failed to load /env.json. Please refresh the page to reload.' });
    throw new Error('Failed to load env.json.');
  }

  const env = await response.json();

  app.set('env', env);
});

app.register('provider://log/history', async app => {
  const websocket = app.get('websocket');

  if (websocket.ready) {
    websocket.send('read://log/history');
  } else {
    let onReady;

    websocket.on(
      'socket://ready',
      (onReady = () => {
        websocket.off('socket://ready', onReady);
        websocket.send('read://log/history');
      })
    );
  }
});

app.register('page://loading', async app => {
  renderer.render(pages.loading);
});

app.register('page://error/setup', async app => renderer.render(pages.error));

app.register('page://error/websocket', async app => {
  const websocket = app.get('websocket');

  function navigateToLogsAndUnregister() {
    websocket.off('socket://ready', navigateToLogsAndUnregister);

    app.run('page://logs');
  }

  websocket.on('socket://ready', navigateToLogsAndUnregister);

  renderer.render(pages.error, {
    message: 'Websocket connection was lost or could not be established. Retrying to connect.',
  });
});

app.register('page://error', async (app, { message, onFix, onFixLabel }) => {
  renderer.render(pages.error, { message, onFix, onFixLabel });
});

app.register('page://logs', async app => {
  renderer.render(pages.logs);
});

app.register('page-events://logs/refresh', async app => {
  app.run('page://loading');

  const websocket = app.get('websocket');

  function refresh() {
    websocket.send('on://log/event/new-log');
    websocket.send('read://log/history');
  }

  websocket.ready ? refresh() : websocket.on('socket://ready', refresh);
});

app.register('page-events://logs/clear', async app => {
  pages.logs.clearLogs();
});

app.register('page-events://logs/append-log', async (app, { log }) => {
  pages.logs.appendLog(log);
});

app.run('core://init');
