import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { M3Field } from './field.js';

import { outlinedFieldStyles } from './outlined-field-styles.css.js';

@customElement('md-outlined-field')
export class M3OutlinedField extends M3Field {
  static override styles = [...super.styles, outlinedFieldStyles];

  protected override renderContainerContent() {
    return html`
      ${this.renderOutline()} ${this.renderStart()}
      <div class="middle">
        <div class="input-wrapper">
          <slot></slot>
        </div>
      </div>
      ${this.renderEnd()}
    `;
  }

  protected renderOutline() {
    return html`
      <div class="outline">
        <div class="outline-start"></div>
        <div class="outline-notch">
          <span class="label">${this.label}</span>
        </div>
        <div class="outline-end"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'md-outlined-field': M3OutlinedField;
  }
}
