import { customElement } from 'lit/decorators.js';
import { property } from 'lit/decorators.js';

import { Menu } from '../base/menu.js';
import { menuStyles } from './menu-styles.css.js';

/**
 * @tag md-menu
 *
 * @csspart menu-surface
 * @csspart list
 *
 * @slot - menu items
 */
@customElement('md-menu')
export class M3Menu extends Menu {
  override readonly _possibleItemTags = [
    'md-menu-item',
    'md-menu-item-checkbox',
    'md-menu-item-radio',
    'md-option',
  ];
  override readonly _durations = { show: 300, hide: 150 };
  // FIXME: Might cause a long list to scroll more than expected
  // override readonly _scrollPadding = 4;

  static override styles = [menuStyles];

  @property({ reflect: true }) color: 'standard' | 'vibrant' = 'standard';
}

declare global {
  interface HTMLElementTagNameMap {
    'md-menu': M3Menu;
  }
}
