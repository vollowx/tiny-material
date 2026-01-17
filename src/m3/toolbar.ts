import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  internals,
  InternalsAttached,
} from '../base/mixins/internals-attached.js';

import { toolbarStyles } from './toolbar-styles.css.js';

/**
 * @tag md-toolbar
 *
 * @csspart container
 * @csspart fab-slot
 *
 * @slot - toolbar contents
 * @slot fab - FAB element
 */
@customElement('md-toolbar')
export class M3Toolbar extends InternalsAttached(LitElement) {
  static override styles = [toolbarStyles];

  constructor() {
    super();
    this[internals].role = 'toolbar';
    this[internals].ariaOrientation = this.orientation;
  }

  @property({ reflect: true }) type: 'docked' | 'floating' = 'docked';
  @property({ reflect: true }) color: 'standard' | 'vibrant' = 'standard';
  @property({ reflect: true }) orientation: 'horizontal' | 'vertical' =
    'horizontal';

  protected override updated(changed: Map<string, unknown>) {
    if (changed.has('orientation')) {
      this[internals].ariaOrientation = this.orientation;
    }
  }

  override render() {
    return html`
      <div part="container">
        <slot></slot>
      </div>
      <div part="fab-slot">
        <slot name="fab"></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'md-toolbar': M3Toolbar;
  }
}
