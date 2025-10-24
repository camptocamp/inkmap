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
    const btnHtml = `<button role="button" class="cancel-btn btn btn-danger flex-shrink m-0" style="padding: 6px; line-height: 8px" title="cancel job">&times;</button>`;

    this.innerHTML = `
      <div>
        ${this.jobsStatus_
          .map(
            (job) => `
            <label style="width: 100%">
                <span>job #${job.id} progress:</span>
                <div class="d-flex flex-row align-items-center" style="gap: 8px">
                    <custom-progress class="w-100" progress="${job.progress}" status="${job.status}"></custom-progress>
                    ${job.status === 'ongoing' ? btnHtml : ''}
                </div>
            </label>`,
          )
          .join('\n')}
      </div>`;

    const dispatchCancelJobEvent = (jobId) => () =>
      this.dispatchEvent(
        new CustomEvent('cancelJob', {
          detail: { jobId },
        }),
      );

    this.querySelectorAll('.cancel-btn').forEach((btn, index) =>
      btn.addEventListener(
        'click',
        dispatchCancelJobEvent(this.jobsStatus_[index].id),
      ),
    );
  }
}

customElements.define('progress-bars', ProgressBars);
