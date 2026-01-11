import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { M3Select } from './select.js';

import '../field/filled-field.js';

import { selectStyles } from './select-styles.css.js';
import { menuPartStyles } from '../menu-part-styles.css.js';

@customElement('md-filled-select')
export class MdFilledSelect extends M3Select {
  static override styles = [menuPartStyles, selectStyles];

  protected override renderField() {
    return html`
      <md-filled-field
        part="field"
        .label=${this.label}
        .populated=${!!this.value}
        .disabled=${this.disabled}
        .required=${this.required}
        .error=${this.error}
        .focused=${this.open || this.fieldFocused}
        supportingtext=${this.supportingText}
        @click=${this.toggle}
        @keydown=${this.handleFieldKeydown}
        @focus=${() => (this.fieldFocused = true)}
        @blur=${() => (this.fieldFocused = false)}
        tabindex=${this.disabled ? '-1' : '0'}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded=${this.open}
        aria-controls="menu"
        aria-disabled=${this.disabled}
        aria-required=${this.required}
      >
        ${this.renderFieldContent()}
      </md-filled-field>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'md-filled-select': MdFilledSelect;
  }
}
