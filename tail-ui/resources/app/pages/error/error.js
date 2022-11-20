import { Component } from '../../util/Renderer.js';

export default class ErrorPage extends Component {
  constructor() {
    super();

    this.$el = document.createElement('div');
    this.$el.classList.add('page');
    this.$el.classList.add('page--error');
    this.$el.style = `
      display: flex;
      align-items: center;
      justify-content: center;
    `;
  }

  mount(
    $root,
    app,
    {
      message = `An unspecified error has occurred. Reload the page to attempt to fix it.`,
      onFix,
      onFixLabel = 'Retry',
    } = {}
  ) {
    this.$el.innerHTML = `<span class="message">${message}</span>`;

    if (typeof onFix === 'function') {
      const $onFix = document.createElement('button');
      $onFix.classList.add('on-fix');
      $onFix.textContent = onFixLabel;
      $onFix.onclick = onFix;

      this.$el.appendChild($onFix);
    }

    $root.appendChild(this.$el);
  }

  unmount() {
    this.$el.remove();
  }
}
