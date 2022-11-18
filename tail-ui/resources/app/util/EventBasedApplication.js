import EventEmitter from './EventEmitter.js';

export default class EventBasedApplication {
  constructor() {
    this._ = {
      eventEmitter: new EventEmitter(),
      state: new Map(),
    };
  }

  set(key, value) {
    this._.state.set(key, value);

    return this;
  }

  get(key, _default) {
    const value = this._.state.get(key);

    return value === null || value === undefined ? _default : value;
  }

  delete(key) {
    this._.state.delete(key);

    return this;
  }

  register(event, handler) {
    this._.eventEmitter.on(event, data => handler(this, data));

    return this;
  }

  async run(event, data) {
    await this._.eventEmitter.emit(event, data);

    return this;
  }

  async exec(fn, data) {
    await fn(this, data);

    return this;
  }
}
