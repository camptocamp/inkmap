class CustomProgress extends HTMLElement {
  static get observedAttributes() {
    return ['progress', 'status'];
  }

  constructor() {
    super();

    /** @type {?number} */
    this.progress_ = null;

    /** @type {?'pending' | 'ongoing' | 'finished' | 'canceled'} */
    this.status_ = 'pending';

    /** @type {HTMLElement} */
    this.progressBar = null;

    /** @type {HTMLElement} */
    this.progressBarInner = null;
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

  /**
   * setting a status will change the progresse bar color
   * * pending: secondary
   * * ongoing: primary
   * * finished: success
   * * canceled: danger
   *
   * defaults to pending
   * @param {?'pending' | 'ongoing' | 'finished' | 'canceled'} progress
   */
  set status(status) {
    if (!['pending', 'ongoing', 'finished', 'canceled'].includes(status)) {
      this.status_ = 'pending';
    } else {
      this.status_ = status;
    }
    this.refreshDOM();
  }

  connectedCallback() {
    this.innerHTML = `
  <div class="progress mt-1" style="height: 5px; visible">
    <div
      class="progress-bar"
      style="width: 50%"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
    ></div>
  </div>`;

    this.progressBar = this.querySelector('.progress');
    this.progressBarInner = this.progressBar.children.item(0);

    this.refreshDOM();
  }

  attributeChangedCallback(name, _, newValue) {
    switch (name) {
      case 'progress':
        this.progress_ = parseFloat(newValue);
        break;
      case 'status':
        this.status_ = newValue;
        break;
    }
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

    switch (this.status_) {
      case 'pending':
        this.progressBarInner.classList.add('bg-secondary');
        this.progressBarInner.classList.remove('bg-primary');
        this.progressBarInner.classList.remove('bg-success');
        this.progressBarInner.classList.remove('bg-danger');
        break;
      case 'ongoing':
        this.progressBarInner.classList.remove('bg-secondary');
        this.progressBarInner.classList.add('bg-primary');
        this.progressBarInner.classList.remove('bg-success');
        this.progressBarInner.classList.remove('bg-danger');
        break;
      case 'finished':
        this.progressBarInner.classList.remove('bg-secondary');
        this.progressBarInner.classList.remove('bg-primary');
        this.progressBarInner.classList.add('bg-success');
        this.progressBarInner.classList.remove('bg-danger');
        break;
      case 'canceled':
        this.progressBarInner.classList.remove('bg-secondary');
        this.progressBarInner.classList.remove('bg-primary');
        this.progressBarInner.classList.remove('bg-success');
        this.progressBarInner.classList.add('bg-danger');
        break;
    }
  }
}

customElements.define('custom-progress', CustomProgress);
