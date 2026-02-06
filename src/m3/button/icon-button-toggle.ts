import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { ToggleButton } from '../../base/toggle-button.js';

import '../focus-ring.js';
import '../ripple.js';

import { targetStyles } from '../target-styles.css.js';
import { sharedButtonStyles } from './shared-button-styles.css.js';
import { sharedButtonToggleStyles } from './shared-button-toggle-styles.css.js';
import { iconButtonStyles } from './icon-button-styles.css.js';

/**
 * @tag md-icon-button-toggle
 *
 * @csspart icon
 *
 * @slot - icon
 * @slot checked - icon when checked
 */
@customElement('md-icon-button-toggle')
export class M3IconButtonToggle extends ToggleButton {
  static override styles = [
    ...super.styles,
    targetStyles,
    sharedButtonStyles,
    sharedButtonToggleStyles,
    iconButtonStyles,
  ];
  override render() {
    return html`
      <md-focus-ring></md-focus-ring>
      <md-ripple enterbehavior="always"></md-ripple>
      <span part="target"></span>
      <slot part="icon unchecked"></slot>
      <slot part="icon checked" name="checked"></slot>
    `;
  }
  @property({ reflect: true }) size:
    | 'xsmall'
    | 'small'
    | 'medium'
    | 'large'
    | 'xlarge' = 'small';
  @property({ reflect: true }) variant:
    | 'text'
    | 'filled'
    | 'tonal'
    | 'outlined' = 'text';
  @property({ reflect: true }) width: 'standard' | 'narrow' | 'wide' =
    'standard';
}

declare global {
  interface HTMLElementTagNameMap {
    'md-icon-button-toggle': M3IconButtonToggle;
  }
}
