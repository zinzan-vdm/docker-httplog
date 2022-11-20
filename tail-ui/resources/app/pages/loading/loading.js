import { Component } from '../../util/Renderer.js';

export default class LoadingPage extends Component {
  constructor() {
    super();

    this.$el = document.createElement('div');
    this.$el.classList.add('page');
    this.$el.classList.add('page--loading');
    this.$el.textContent = `Loading...`;
    this.$el.style = `
      display: flex;
      align-items: center;
      justify-content: center;
    `;
  }

  mount($root) {
    $root.appendChild(this.$el);
  }

  unmount() {
    this.$el.remove();
  }
}
