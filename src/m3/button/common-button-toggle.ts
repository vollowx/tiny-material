import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { Switch } from '../../base/switch.js';
import { internals } from '../../base/mixins/internals-attached.js';

import '../focus-ring.js';
import '../ripple.js';

import { targetStyles } from '../target-styles.css.js';
import { sharedButtonStyles } from './shared-button-styles.css.js';
import { commonButtonStyles } from './common-button-styles.css.js';
import { commonButtonToggleStyles } from './common-button-toggle-styles.css.js';

/**
 * @tag md-button-toggle
 *
 * @csspart label
 * @csspart label checked
 * @csspart icon
 * @csspart icon checked
 *
 * @slot - label
 * @slot icon - leading icon
 */
@customElement('md-button-toggle')
export class M3ButtonToggle extends Switch {
  static override styles = [
    ...super.styles,
    targetStyles,
    sharedButtonStyles,
    commonButtonStyles,
    commonButtonToggleStyles,
  ];
  constructor() {
    super();
    this[internals].role = 'button';
  }
  override render() {
    return html`
      <md-focus-ring></md-focus-ring>
      <md-ripple></md-ripple>
      <span part="target"></span>
      <slot part="icon unchecked" name="icon" aria-hidden="true"></slot>
      <slot part="icon checked" name="icon-checked" aria-hidden="true"></slot>
      <slot part="label unchecked"></slot>
      <slot part="label checked" name="checked"></slot>
    `;
  }
  @property({ reflect: true }) size:
    | 'xsmall'
    | 'small'
    | 'medium'
    | 'large'
    | 'xlarge' = 'small';
  @property({ reflect: true }) shape: 'rounded' | 'square' = 'rounded';
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
    'md-button-toggle': M3ButtonToggle;
  }
}
