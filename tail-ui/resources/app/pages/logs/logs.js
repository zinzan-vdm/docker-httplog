import { Component } from '../../util/Renderer.js';

export default class LogsPage extends Component {
  constructor() {
    super();

    this.$el = document.createElement('div');

    this.initBase(this.$el);
  }

  initBase($el) {
    $el.classList.add('page');
    $el.classList.add('page--logs');
    $el.innerHTML = `
      <div class="logs"></div>
    `;

    this.$logs = $el.querySelector('.logs');
  }

  clearLogs() {
    this.$logs.innerHTML = '';
  }

  appendLog(log) {
    const $log = document.createElement('div');
    $log.classList.add('log');

    $log.textContent = JSON.stringify(log, false, 2);

    $log.innerHTML = `
      <section class="log__summary">
        <div class="log__summary-stamp">${new Date(log.stamp).toLocaleString()}</div>
        <div class="log__summary-identifier">${log.identifier}</div>
        <div class="log__summary-method log__summary-method--${log.request.method.toLowerCase()}">
          ${log.request.method.toUpperCase()}
        </div>
        <div class="log__summary-url">${log.request.url}</div>
        <div class="log__summary-curl">
          <button class="log__summary-curl-copy">CURL</button>
        </div>
      </section>

      <section class="log__detail">
        <span class="log__detail-heading">Query</span>
        <code class="log__detail-query log__detail-code"></code>
        <span class="log__detail-heading">Headers</span>
        <code class="log__detail-headers log__detail-code"></code>
        <span class="log__detail-heading">Body</span>
        <code class="log__detail-body log__detail-code"></code>
      </section>
    `;

    const $summary = $log.querySelector('.log__summary');
    $summary.onclick = function toggleDetail() {
      $log.classList.toggle('log--detail');
    };

    const $curlCopy = $log.querySelector('.log__summary-curl-copy');
    $curlCopy.onclick = function copyCurl(e) {
      e.preventDefault();
      e.stopPropagation();
      navigator.clipboard.writeText(log.request.curl);
    };

    const $detailQuery = $log.querySelector('.log__detail-query');
    $detailQuery.textContent = JSON.stringify(log.request.query, false, 2) || ' ';

    const $detailHeaders = $log.querySelector('.log__detail-headers');
    $detailHeaders.textContent = JSON.stringify(log.request.headers, false, 2) || ' ';

    const $detailBody = $log.querySelector('.log__detail-body');
    $detailBody.textContent = log.request.body || ' ';

    this.$logs.appendChild($log);

    return $log;
  }

  mount($root) {
    $root.appendChild(this.$el);
  }

  unmount() {
    this.$el.remove();
  }
}
