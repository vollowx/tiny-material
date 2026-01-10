import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { Button } from '../../base/button.js';

import '../focus-ring.js';
import '../ripple.js';

import { targetStyles } from '../target-styles.css.js';
import { sharedButtonStyles } from './shared-button-styles.css.js';
import { iconButtonStyles } from './icon-button-styles.css.js';

/**
 * @tag md-icon-button
 *
 * @csspart icon
 *
 * @slot - icon
 */
@customElement('md-icon-button')
export class M3IconButton extends Button {
  static override styles = [
    ...super.styles,
    targetStyles,
    sharedButtonStyles,
    iconButtonStyles,
  ];
  override render() {
    return html`
      <md-focus-ring></md-focus-ring>
      <md-ripple></md-ripple>
      <span part="target"></span>
      <slot part="icon"></slot>
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
    'md-icon-button': M3IconButton;
  }
}
