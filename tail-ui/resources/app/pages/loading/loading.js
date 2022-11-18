import { Component } from '../../util/Renderer.js';

export default class LoadingPage extends Component {
  constructor() {
    super();

    this.$el = document.createElement('div');
    this.$el.innerHTML = `
      <span>Loading...</span>
    `;
  }

  mount($root) {
    $root.appendChild(this.$el);
  }

  unmount() {
    this.$el.remove();
  }
}
