class CustomButton extends HTMLElement {
  constructor() {
    super();

    /** @type {boolean} */
    this.working_ = false;

    /** @type {?number} */
    this.progress_ = null;

    /** @type {HTMLButtonElement} */
    this.startBtn = null;

    /** @type {HTMLButtonElement} */
    this.waitBtn = null;

    /** @type {HTMLElement} */
    this.progressBar = null;

    /** @type {HTMLElement} */
    this.progressBarInner = null;
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

  /**
   * setting a number between 0..1 will make the progress bar appear
   * setting null will make the progress bar disappear
   * @param {?number} progress
   */
  set progress(progress) {
    this.progress_ = progress;
    this.refreshDOM();
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
</button>
<div class="progress mt-1" style="height: 5px">
  <div
    class="progress-bar"
    style="width: 0"
    role="progressbar"
    aria-valuemin="0"
    aria-valuemax="100"
  ></div>
</div>`;

    this.startBtn = this.querySelector('.start-btn');
    this.waitBtn = this.querySelector('.wait-btn');
    this.progressBar = this.querySelector('.progress');
    this.progressBarInner = this.progressBar.children.item(0);

    this.refreshDOM();
  }

  refreshDOM() {
    if (typeof this.progress_ !== 'number') {
      this.progressBar.style.visibility = 'hidden';
      this.progressBarInner.style.width = '0';
    } else {
      this.progressBar.style.visibility = 'visible';
      this.progressBarInner.style.width =
        Math.round(this.progress_ * 100) + '%';
    }

    this.waitBtn.style.display = this.working_ ? null : 'none';
    this.startBtn.style.display = this.working_ ? 'none' : null;
  }
}

customElements.define('custom-button', CustomButton);
