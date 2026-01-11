import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { M3Field } from './field.js';

import { filledFieldStyles } from './filled-field-styles.css.js';

@customElement('md-filled-field')
export class M3FilledField extends M3Field {
  static override styles = [...super.styles, filledFieldStyles];

  protected override renderContainerContent() {
    return html`
      <md-ripple
        clickbehavior="none"
        enterbehavior="none"
        spacebehavior="none"
      ></md-ripple>
      ${this.renderStart()}
      <div class="middle">
        <span class="label">${this.label}</span>
        <div class="input-wrapper">
          <slot></slot>
        </div>
      </div>
      ${this.renderEnd()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'md-filled-field': M3FilledField;
  }
}
