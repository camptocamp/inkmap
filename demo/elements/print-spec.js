import PresetSpecs from '../preset-specs';

const PresetSpecsNames = Object.keys(PresetSpecs);

class PrintSpec extends HTMLElement {
  constructor() {
    super();

    /** @type {boolean} */
    this.expanded_ = false;

    /**
     * Name of the selected preset spec, or null if a custom spec
     * @type {?string}
     */
    this.currentSpecName_ = null;

    /** @type {string} */
    this.specContent = '';

    /** @type {string} */
    this.error_ = '';

    /** @type {function(boolean):void} */
    this.onValidityCheckHandler_ = null;
  }

  /**
   * @return {?PrintSpec}
   */
  get value() {
    try {
      return JSON.parse(this.specContent);
    } catch {
      return null;
    }
  }

  onValidityCheck(value) {
    this.onValidityCheckHandler_ = value;
  }

  connectedCallback() {
    this.expanded_ = this.getAttribute('expanded') === 'true';

    if (this.getAttribute('select')) {
      this.selectSpec(this.getAttribute('select'));
    } else {
      this.selectSpec(PresetSpecsNames[0]);
    }
  }

  selectSpec(name) {
    this.currentSpecName_ = name;
    const spec = PresetSpecs[name];
    this.specContent = JSON.stringify(spec, null, 2);
    this.refreshDOM();
  }

  checkSpecValidity() {
    try {
      this.error_ = '';
      JSON.parse(this.specContent);
    } catch (err) {
      this.error_ = err.message;
    }

    const hasError = !!this.error_;

    const jsonValidElt = this.querySelector('.json-validity');
    if (jsonValidElt) {
      jsonValidElt.classList.toggle('text-success', !hasError);
      jsonValidElt.classList.toggle('text-danger', hasError);
      jsonValidElt.textContent = hasError
        ? 'The JSON object is invalid: ' + this.error_
        : 'The JSON object is valid!';
    }

    if (!!this.onValidityCheckHandler_) {
      this.onValidityCheckHandler_.call(this, !this.error_);
    }
  }

  refreshDOM() {
    this.innerHTML = this.expanded_
      ? `
<div class="border rounded p-1">
  <div class="dropdown d-flex flex-row align-items-baseline">
    <button class="btn btn-sm btn-info dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      ${this.currentSpecName_}
    </button>
    <div class="dropdown-menu" aria-label="List of print specs">
      ${PresetSpecsNames.map(
        (name) => `
        <button type="button" class="dropdown-item preset-spec ${
          name === this.currentSpecName_ ? 'active' : ''
        }" data-name="${name}">
          ${name}
        </button>`
      ).join('\n')}
    </div>
    <span class="mx-2 flex-grow-1">Choose a predefined spec from the list.</span>
    <a href="#" class="mx-2 toggle-spec-btn">Hide</a>
  </div>
  <label class="d-block m-0 mt-1">
    <textarea
      class="spec form-control text-monospace border-0"
      rows="20"
      style="font-size: 12px"
    >${this.specContent}</textarea>
  </label>
</div>
<small class="json-validity text-secondary">
  Please provide a valid JSON object.
</small>`
      : `
<div class="dropdown d-flex flex-row align-items-baseline p-1 border rounded">
  <button class="btn btn-sm btn-info dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
    ${this.currentSpecName_}
  </button>
  <div class="dropdown-menu" aria-label="List of print specs">
    ${PresetSpecsNames.map(
      (name) => `
      <button type="button" class="dropdown-item preset-spec ${
        name === this.currentSpecName_ ? 'active' : ''
      }" data-name="${name}">
        ${name}
      </button>`
    ).join('\n')}
  </div>
  <span class="mx-2 flex-grow-1">Choose a predefined spec from the list.</span>
  <a href="#" class="mx-2 toggle-spec-btn">Show</a>
</div>`;

    const presetSpecElts =
      /** @type {HTMLButtonElement[]} */
      Array.from(this.querySelectorAll('.preset-spec'));

    presetSpecElts.forEach((elt) =>
      elt.addEventListener('click', () => {
        this.selectSpec(elt.getAttribute('data-name'));
        this.refreshDOM();
      })
    );

    if (this.expanded_) {
      const textElt = this.querySelector('.spec');
      const specName = this.querySelector('.dropdown-toggle');
      textElt.addEventListener('input', () => {
        this.specContent = textElt.value;
        specName.innerText = 'Custom spec ';
        this.currentSpecName_ = 'Custom spec';
        this.checkSpecValidity();
      });
    }

    const toggleSpecBtn = this.querySelector('.toggle-spec-btn');
    toggleSpecBtn.addEventListener('click', (evt) => {
      this.setExpanded(!this.expanded_);
      evt.preventDefault();
    });
  }

  setExpanded(expanded) {
    this.expanded_ = expanded;
    this.refreshDOM();
  }
}

customElements.define('print-spec', PrintSpec);
