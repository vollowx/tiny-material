import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { FormAssociated } from './mixins/form-associated.js';
import { InternalsAttached, internals } from './mixins/internals-attached.js';
import { hiddenStyles } from './hidden-styles.css.js';

const PROPERTY_FROM_ARIA_CHECKED = {
  true: 'checked',
  false: 'unchecked',
  mixed: 'indeterminate',
};

const Base = FormAssociated(InternalsAttached(LitElement));

export class Checkbox extends Base {
  static override styles = [hiddenStyles];

  @property({ type: Boolean }) checked = false;
  @property({ type: Boolean }) indeterminate = false;
  @property({ type: Boolean, reflect: true }) required = false;

  constructor() {
    super();
    this[internals].role = 'checkbox';

    this.checked = this.hasAttribute('checked');
    this.indeterminate = this.hasAttribute('indeterminate');
    this.updateState();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this.#handleClick);
    this.addEventListener('keydown', this.#handleKeyDown);
    this.addEventListener('keyup', this.#handleKeyUp);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.#handleClick);
    this.removeEventListener('keydown', this.#handleKeyDown);
    this.removeEventListener('keyup', this.#handleKeyUp);
  }

  protected override updated(changed: Map<string, any>) {
    if (
      changed.has('checked') ||
      changed.has('disabled') ||
      changed.has('indeterminate') ||
      changed.has('required')
    ) {
      this.updateState();
    }
  }

  protected updateState() {
    const prevAriaChecked = this[internals]
      .ariaChecked as keyof typeof PROPERTY_FROM_ARIA_CHECKED;

    this[internals].states.delete('was-unchecked');
    this[internals].states.delete('was-checked');
    this[internals].states.delete('was-indeterminate');

    if (prevAriaChecked && PROPERTY_FROM_ARIA_CHECKED[prevAriaChecked]) {
      this[internals].states.add(
        `was-${PROPERTY_FROM_ARIA_CHECKED[prevAriaChecked]}`
      );
    }

    this[internals].ariaChecked = this.indeterminate
      ? 'mixed'
      : this.checked
        ? 'true'
        : 'false';

    const currentAriaChecked = this[internals]
      .ariaChecked as keyof typeof PROPERTY_FROM_ARIA_CHECKED;

    this[internals].states.delete('unchecked');
    this[internals].states.delete('checked');
    this[internals].states.delete('indeterminate');
    this[internals].states.add(
      `${PROPERTY_FROM_ARIA_CHECKED[currentAriaChecked]}`
    );

    this.tabIndex = this.disabled ? -1 : 0;
    this[internals].ariaDisabled = String(this.disabled);

    this[internals].setFormValue(this.checked ? 'on' : null);

    if (this.required && !this.checked) {
      this[internals].setValidity(
        { valueMissing: true },
        // TODO: I18n
        'Please check this box if you want to proceed.'
      );
    } else {
      this[internals].setValidity({});
    }
  }

  #handleClick = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
    this.#toggleChecked();
  };

  #handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  #handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      this.#toggleChecked();
    }
  };

  #toggleChecked() {
    if (this.disabled) return;

    this.checked = !this.checked;
    this.indeterminate = false;
    this.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: this.checked,
      })
    );
  }
}
