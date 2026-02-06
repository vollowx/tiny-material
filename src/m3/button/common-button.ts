import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { Button } from '../../base/button.js';

import '../focus-ring.js';
import '../ripple.js';

import { targetStyles } from '../target-styles.css.js';
import { sharedButtonStyles } from './shared-button-styles.css.js';
import { commonButtonStyles } from './common-button-styles.css.js';

/**
 * @tag md-button
 *
 * @csspart label
 * @csspart icon
 *
 * @slot - label
 * @slot icon - leading icon
 */
@customElement('md-button')
export class M3Button extends Button {
  static override styles = [
    ...super.styles,
    targetStyles,
    sharedButtonStyles,
    commonButtonStyles,
  ];
  override render() {
    return html`
      <md-focus-ring></md-focus-ring>
      <md-ripple></md-ripple>
      <span part="target"></span>
      <slot part="icon" name="icon" aria-hidden="true"></slot>
      <slot part="label"></slot>
    `;
  }
  @property({ reflect: true }) size:
    | 'xsmall'
    | 'small'
    | 'medium'
    | 'large'
    | 'xlarge' = 'small';
  @property({ reflect: true }) shape: 'rounded' | 'square' = 'rounded';
  @property({ reflect: true }) color: 'primary' | 'secondary' | 'tertiary' =
    'primary';
  @property({ reflect: true }) variant:
    | 'filled'
    | 'tonal'
    | 'elevated'
    | 'outlined'
    | 'text' = 'filled';
  /**
   * Whether to show the icon at the end of the button.
   */
  @property({ type: Boolean, reflect: true }) trailingIcon = false;
}

declare global {
  interface HTMLElementTagNameMap {
    'md-button': M3Button;
  }
}
