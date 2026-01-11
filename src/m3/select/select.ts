import { property, query, state } from 'lit/decorators.js';

import { Select } from '../../base/select.js';
import { M3Field } from '../field/field.js';

/**
 * @fires {Event} change - Fired when the selected value has changed.
 * @fires {Event} input - Fired when the selected value has changed.
 */
export abstract class M3Select extends Select {
  override readonly _possibleItemTags = ['md-option'];
  override readonly _durations = { show: 300, hide: 200 };
  override readonly _scrollPadding = 4;

  @property({ type: String }) label = '';
  @property({ type: String }) supportingText = '';
  @property({ type: Boolean, reflect: true }) error = false;

  @state() protected fieldFocused = false;

  @query('md-filled-field, md-outlined-field') protected field!: M3Field;
}
