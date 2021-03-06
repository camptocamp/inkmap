class CustomButton extends HTMLElement {
  constructor() {
    super();

    /** @type {boolean} */
    this.working_ = false;

    /** @type {HTMLButtonElement} */
    this.startBtn = null;

    /** @type {HTMLButtonElement} */
    this.waitBtn = null;

    /** @type {boolean} */
    this.enabled_ = true;
  }

  /**
   * @param {boolean} working
   */
  set working(working) {
    this.working_ = working;
    if (!working) {
      this.progress_ = null;
    }
    this.refreshDOM();
  }

  set enabled(enabled) {
    this.enabled_ = enabled;
    this.refreshDOM();
  }

  showSpinner() {
    this.working = true;
  }

  hideSpinner() {
    this.working = false;
  }

  connectedCallback() {
    this.innerHTML = `
<button role="button" class="start-btn btn btn-primary btn-block">
  ${this.innerHTML.trim()}
</button>
<button
  role="button"
  disabled
  class="wait-btn btn btn-primary btn-block mt-0"
>
  <span
    class="spinner-border spinner-border-sm"
    role="status"
    aria-hidden="true"
  ></span>
  Working...
</button>`;

    this.startBtn = this.querySelector('.start-btn');
    this.waitBtn = this.querySelector('.wait-btn');

    this.refreshDOM();
  }

  refreshDOM() {
    this.waitBtn.style.display = this.working_ ? null : 'none';
    this.startBtn.style.display = this.working_ ? 'none' : null;
    this.startBtn.disabled = !this.enabled_;
  }
}

customElements.define('custom-button', CustomButton);
