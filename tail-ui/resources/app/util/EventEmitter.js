export default class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  __getEventListeners(event) {
    let eventListeners = this.listeners.get(event);

    if (!eventListeners) {
      eventListeners = new Set();
      this.listeners.set(event, eventListeners);
    }

    return eventListeners;
  }

  async __runListener(listener, data) {
    return await listener(data);
  }

  async __runListeners(listeners, data) {
    const promises = [];

    for (let listener of listeners) {
      promises.push(this.__runListener(listener, data));
    }

    try {
      await Promise.all(promises);
    } catch (e) {}

    return;
  }

  on(event, listener) {
    const eventListeners = this.__getEventListeners(event);

    eventListeners.add(listener);

    return this;
  }

  off(event, listener) {
    const eventListeners = this.__getEventListeners(event);

    eventListeners.delete(listener);

    return this;
  }

  async emit(event, data = {}) {
    const eventListeners = this.__getEventListeners(event);

    return await this.__runListeners(eventListeners, data);
  }
}
