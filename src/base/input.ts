/**
 * @license
 * Copyright 2018-2023 Google, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { LitElement, html, nothing, PropertyValues } from 'lit';
import { property, query } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';

import { InternalsAttached, internals } from './mixins/internals-attached.js';
import { FocusDelegated } from './mixins/focus-delegated.js';
import { FormAssociated } from './mixins/form-associated.js';

const Base = FormAssociated(FocusDelegated(InternalsAttached(LitElement)));

export class Input extends Base {
  @property({ reflect: true }) type = 'text';
  @property() value = '';
  @property({ reflect: true }) placeholder = '';
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) readOnly = false;

  /**
   * Whether the input accepts multiple values (e.g. email).
   */
  @property({ type: Boolean, reflect: true }) multiple = false;

  @property() min = '';
  @property() max = '';
  @property() step = '';
  @property({ type: Number }) minLength = -1;
  @property({ type: Number }) maxLength = -1;

  /**
   * The pattern regex.
   */
  @property() pattern = '';

  @property({ reflect: true }) autocomplete = '';

  @property({ type: Boolean, reflect: true }) focused = false;

  @query('[part~=input]') inputOrTextarea!:
    | HTMLInputElement
    | HTMLTextAreaElement;

  override render() {
    const isTextarea = this.type === 'textarea';

    const minLength = this.minLength > -1 ? this.minLength : nothing;
    const maxLength = this.maxLength > -1 ? this.maxLength : nothing;

    if (isTextarea) {
      return html`
        <textarea
          part="input"
          .value=${live(this.value)}
          placeholder=${(this.placeholder || nothing) as any}
          ?required=${this.required}
          ?readonly=${this.readOnly}
          ?disabled=${this.disabled}
          minlength=${minLength as any}
          maxlength=${maxLength as any}
          autocomplete=${(this.autocomplete || nothing) as any}
          @input=${this.handleInput}
          @change=${this.handleChange}
          @focus=${this.handleFocus}
          @blur=${this.handleBlur}
        ></textarea>
      `;
    }

    return html`
      <input
        part="input"
        type=${this.type as any}
        .value=${live(this.value)}
        placeholder=${(this.placeholder || nothing) as any}
        ?required=${this.required}
        ?readonly=${this.readOnly}
        ?disabled=${this.disabled}
        ?multiple=${this.multiple}
        min=${(this.min || nothing) as any}
        max=${(this.max || nothing) as any}
        step=${(this.step || nothing) as any}
        minlength=${minLength as any}
        maxlength=${maxLength as any}
        pattern=${(this.pattern || nothing) as any}
        autocomplete=${(this.autocomplete || nothing) as any}
        @input=${this.handleInput}
        @change=${this.handleChange}
        @focus=${this.handleFocus}
        @blur=${this.handleBlur}
      />
    `;
  }

  protected override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this[internals].setFormValue(this.value);
      this.syncValidity();
    }
  }

  private handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.syncValidity();
  }

  private handleChange(event: Event) {
    this.redispatchEvent(event);
  }

  private handleFocus() {
    this.focused = true;
  }

  private handleBlur() {
    this.focused = false;
  }

  private redispatchEvent(event: Event) {
    // Redispatch 'change' event as composed to escape shadow root
    const newEvent = new Event(event.type, {
      bubbles: event.bubbles,
      cancelable: event.cancelable,
      composed: true,
    });
    this.dispatchEvent(newEvent);
  }

  private syncValidity() {
    if (!this.inputOrTextarea) return;
    this[internals].setValidity(
      this.inputOrTextarea.validity,
      this.inputOrTextarea.validationMessage,
      this.inputOrTextarea
    );
  }

  select() {
    this.inputOrTextarea?.select();
  }

  stepUp(n?: number) {
    (this.inputOrTextarea as HTMLInputElement)?.stepUp(n);
    this.handleInput({ target: this.inputOrTextarea } as any);
  }

  stepDown(n?: number) {
    (this.inputOrTextarea as HTMLInputElement)?.stepDown(n);
    this.handleInput({ target: this.inputOrTextarea } as any);
  }

  formResetCallback() {
    this.value = this.getAttribute('value') || '';
    this.syncValidity();
  }

  formStateRestoreCallback(state: string) {
    this.value = state;
    this.syncValidity();
  }
}
