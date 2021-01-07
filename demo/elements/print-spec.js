import PresetSpecs from '../preset-specs';

class PrintSpec extends HTMLElement {
  constructor() {
    super();

    /** @type {boolean} */
    this.editable_ = false;

    /**
     * Name of the selected preset spec, or null if a custom spec
     * @type {?string}
     */
    this.currentSpecName_ = null;

    /** @type {HTMLButtonElement[]} */
    this.presetSpecElts = null;

    /** @type {HTMLTextAreaElement} */
    this.textElt = null;
  }

  /**
   * @return {PrintSpec}
   */
  get value() {
    return JSON.parse(this.textElt.value);
  }

  connectedCallback() {
    const specNames = Object.keys(PresetSpecs);

    this.innerHTML = `
<div>
  <div class="dropdown">
    <button class="btn btn-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      Choose a predefined spec below
    </button>
    <div class="dropdown-menu" aria-label="List of print specs">
      ${specNames
        .map(
          (name) => `
        <button type="button" class="dropdown-item preset-spec" data-name="${name}">
          ${name}
        </button>`
        )
        .join('\n')}
    </div>
  </div>
  <label class="d-block mt-2">
    <textarea
      class="spec form-control text-monospace"
      rows="20"
      style="font-size: 12px"
    ></textarea>
    <small class="text-secondary">
      Please provide a valid JSON object.
    </small>
  </label>
</div>`;

    this.presetSpecElts =
      /** @type {HTMLButtonElement[]} */
      Array.from(this.querySelectorAll('.preset-spec'));
    this.textElt = this.querySelector('.spec');

    this.editable_ = this.getAttribute('editable') === 'true';

    this.presetSpecElts.forEach((elt) =>
      elt.addEventListener('click', () => {
        this.selectSpec(elt.getAttribute('data-name'));
        this.refreshDOM();
      })
    );

    this.textElt.addEventListener('change', () => {
      this.currentSpecName_ = null;
    });

    if (this.getAttribute('select')) {
      this.selectSpec(this.getAttribute('select'));
    } else {
      this.selectSpec(specNames[0]);
    }

    this.refreshDOM();
  }

  selectSpec(name) {
    this.currentSpecName_ = name;
    const spec = PresetSpecs[name];
    this.textElt.value = JSON.stringify(spec, null, 2);
  }

  refreshDOM() {
    this.textElt.parentElement.classList.toggle('d-none', !this.editable_);
    this.textElt.parentElement.classList.toggle('d-block', this.editable_);

    this.presetSpecElts.forEach((elt) => {
      const name = elt.getAttribute('data-name');
      elt.classList.toggle('active', name === this.currentSpecName_);
    });
  }
}

customElements.define('print-spec', PrintSpec);
