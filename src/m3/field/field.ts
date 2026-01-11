import { html, PropertyValues, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Field } from '../../base/field.js';

import { fieldStyles } from './field-styles.css.js';

/**
 * @fires {Event} change - Fired when the selected value has changed.
 * @fires {Event} input - Fired when the selected value has changed.
 */
export abstract class M3Field extends Field {
  static override styles = [fieldStyles];

  @property({ type: String, reflect: true }) label = '';
  @property({ type: String, reflect: true }) supportingText = '';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) error = false;
  @property({ type: Boolean, reflect: true }) focused = false;
  @property({ type: Boolean, reflect: true }) populated = false;

  @property({ type: Boolean, reflect: true }) hasLabel = false;

  @state() hasStart = false;
  @state() hasEnd = false;

  override update(changedProperties: PropertyValues) {
    if (changedProperties.has('label')) {
      this.hasLabel = !!this.label;
    }
    super.update(changedProperties);
  }

  override render() {
    return html`
      <div class="container">${this.renderContainerContent()}</div>
      ${this.renderSupportingText()}
    `;
  }

  /**
   * Should be implemented by subclasses.
   */
  protected abstract renderContainerContent(): TemplateResult;

  protected renderSupportingText() {
    if (!this.supportingText) {
      return '';
    }

    return html`<div class="supporting-text">${this.supportingText}</div>`;
  }

  protected renderStart() {
    return html`<slot
      name="start"
      class="start"
      ?hidden=${!this.hasStart}
      @slotchange=${this.handleSlotChange}
    ></slot>`;
  }

  protected renderEnd() {
    return html`<slot
      name="end"
      class="end"
      ?hidden=${!this.hasEnd}
      @slotchange=${this.handleSlotChange}
    ></slot>`;
  }

  protected handleSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    const hasContent = slot.assignedNodes({ flatten: true }).length > 0;
    if (slot.name === 'start') this.hasStart = hasContent;
    if (slot.name === 'end') this.hasEnd = hasContent;
  }
}
