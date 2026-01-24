import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { InternalsAttached, internals } from './mixins/internals-attached.js';
import { FormAssociated } from './mixins/form-associated.js';

import { hiddenStyles } from './hidden-styles.css.js';

const PROPERTY_FROM_ARIA_PRESSED = {
  true: 'checked',
  false: 'unchecked',
};

const Base = FormAssociated(InternalsAttached(LitElement));

export class Switch extends Base {
  static override styles = [hiddenStyles];

  @property({ type: Boolean }) checked = false;

  constructor() {
    super();
    this[internals].role = 'switch';

    this.checked = this.hasAttribute('checked');
    this.updateInternals();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this.#handleClick);
    this.addEventListener('keydown', this.#handleKeyDown);
    this.addEventListener('keyup', this.#handleKeyUp);
    this.labels.forEach((label) => {
      label.addEventListener('click', this.#handleLabelClick);
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.#handleClick);
    this.removeEventListener('keydown', this.#handleKeyDown);
    this.removeEventListener('keyup', this.#handleKeyUp);
    this.labels.forEach((label) => {
      label.removeEventListener('click', this.#handleLabelClick);
    });
  }

  protected override updated(changed: Map<string, any>) {
    if (changed.has('checked') || changed.has('disabled')) {
      this.updateInternals();
    }
  }

  private updateInternals() {
    this[internals].states.delete('unchecked');
    this[internals].states.delete('checked');
    this[internals].ariaPressed = this.checked ? 'true' : 'false';
    this[internals].states.add(
      `${PROPERTY_FROM_ARIA_PRESSED[this[internals].ariaPressed]}`
    );

    this.setAttribute('tabindex', this.disabled ? '-1' : '0');
    this[internals].ariaDisabled = this.disabled ? 'true' : 'false';

    this[internals].setFormValue(this.checked ? 'on' : null);
  }

  /**
   * **Drag-and-drop to the other side**
   *
   * *`checked` is supposed to be changed once*
   *
   * 1. `pointerdown`: _ignoreClick = false
   * 2. `pointermove`: _ignoreClick = true
   * 3. `pointerup`: `checked` changed
   * 4. `click`: ignored, _ignoreClick = false
   *
   * **Drag-and-drop to the other side, then click**
   *
   * *`checked` is supposed to be changed twice*
   *
   * 1. `pointerdown`: _ignoreClick = false
   * 2. `pointermove`: _ignoreClick = true
   * 3. `pointerup`: `checked` changed(1)
   * 4. `click`: ignored, _ignoreClick = false
   * 5. `click`: `checked` changed(2)
   *
   * **Drag-and-drop to the other side, then click the label**
   *
   * *`checked` is supposed to be changed twice*
   *
   * 1. `pointerdown`: _ignoreClick = false
   * 2. `pointermove`: _ignoreClick = true
   * 3. `pointerup`: `checked` changed(1)
   * 4. `click` on label: _ignoreClick = false
   * 5. `click` on switch: `checked` changed(2)
   */
  protected _ignoreClick = false;

  #handleLabelClick = () => {
    this._ignoreClick = false;
  };

  #handleClick = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
    if (this._ignoreClick) {
      console.log('ignoring click from', e.target);
      this._ignoreClick = false;
      return;
    }
    this.toggleChecked();
  };

  #handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    e.stopPropagation();
    if (e.key === 'Enter') this.toggleChecked();
  };

  #handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      this.toggleChecked();
    }
  };

  protected toggleChecked() {
    if (this.disabled) return;

    this.checked = !this.checked;
    this.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: this.checked,
      })
    );
  }
}
