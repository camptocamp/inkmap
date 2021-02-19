class ProgressBars extends HTMLElement {
  constructor() {
    super();

    /** @type {?PrintStatus[]} */
    this.jobsStatus_ = [];
  }

  /**
   *
   * @param {?PrintStatus[]} jobsStatus
   */
  set jobsStatus(jobsStatus) {
    this.jobsStatus_ = jobsStatus;
    this.refreshDOM();
  }

  connectedCallback() {
    this.refreshDOM();
  }

  refreshDOM() {
    this.innerHTML = `
      <div>
        ${this.jobsStatus_
          .map(
            (job) => `
            <label style="width: 100%">
                job #${job.id} progress:
            <custom-progress progress="${job.progress}" status="${job.status}"></custom-progress>
            </label>`
          )
          .join('\n')}
      </div>`;
  }
}

customElements.define('progress-bars', ProgressBars);
