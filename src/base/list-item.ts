import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { genUniqueId } from '../core/unique-id.js';
import { InternalsAttached, internals } from './mixins/internals-attached.js';
import { FormAssociated } from './mixins/form-associated.js';

import { hiddenStyles } from './hidden-styles.css.js';

export class ListItem extends FormAssociated(InternalsAttached(LitElement)) {
  static override styles = [hiddenStyles];

  @property({ type: Boolean, reflect: true }) selected = false;
  @property({ type: Boolean, reflect: true }) focused = false;

  get displayText(): string {
    return this.innerText.trim();
  }

  _role: string = 'option';

  override connectedCallback() {
    super.connectedCallback();
    this[internals].role = this._role;
    this.setAttribute('tabindex', '-1');
    this.#updateInternals();
    if (!this.id) this.id = genUniqueId('item');
  }

  protected override updated(changed: Map<string, any>) {
    super.updated(changed);
    if (
      changed.has('disabled') ||
      changed.has('focused') ||
      changed.has('selected')
    ) {
      this.#updateInternals();
    }
  }

  #updateInternals() {
    this[internals].ariaDisabled = this.disabled ? 'true' : 'false';
    this.focused
      ? this[internals].states.add('focused')
      : this[internals].states.delete('focused');
    this[internals].ariaSelected = this.selected ? 'true' : 'false';
    this.selected
      ? this[internals].states.add('selected')
      : this[internals].states.delete('selected');
  }

  override focus(): void {
    this.focused = true;
  }

  override blur(): void {
    this.focused = false;
  }
}
