export default class Renderer {
  constructor({ el, app }) {
    this.$root = typeof el === 'string' ? document.querySelector(el) : el;

    if (!this.$root) {
      throw new Error(`Renderer: Provided el (${el}) does not resolve an element that can be used as root.`);
    }

    this.app = app;

    this.mountedComponent = null;
  }

  render(component, options = {}) {
    this.__unmountCurrentComponent();

    this.__mountComponent(component, options);
  }

  clear() {
    this.__unmountCurrentComponent();
  }

  __mountComponent(component, options = {}) {
    component.mount(this.$root, this.app, options);

    this.mountedComponent = component;
  }

  __unmountCurrentComponent() {
    if (!this.mountedComponent) {
      return;
    }

    this.mountedComponent.unmount(this.$root, this.app);
  }
}

export class Component {
  mount($root, app, options = {}) {
    this.$el = this.$el || document.createElement('div');

    this.$el.textContent =
      'Component: Override the "mount($root, app, options?)" instance method of your component to customize how it renders.';

    $root.appendChild(this.$el);
  }

  unmount($root, app) {
    console.warn(
      'Component: Override the "unmount($root, app)" instance method of your component to customize how it unmounts.'
    );

    if (this.$el && this.$el.parentElement === $root) {
      this.$el.remove();
    }
  }
}
