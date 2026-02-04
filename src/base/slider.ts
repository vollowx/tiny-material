/**
 * @license
 * Copyright 2018-2023 Google, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { LitElement, html, PropertyValues, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { FormAssociated } from './mixins/form-associated.js';
import { InternalsAttached, internals } from './mixins/internals-attached.js';

const Base = FormAssociated(InternalsAttached(LitElement));

export class Slider extends Base {
  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;
  @property({ type: Number }) value?: number;
  @property({ type: Number, attribute: 'value-start' }) valueStart?: number;
  @property({ type: Number, attribute: 'value-end' }) valueEnd?: number;
  @property({ attribute: 'value-label' }) valueLabel = '';
  @property({ attribute: 'value-label-start' }) valueLabelStart = '';
  @property({ attribute: 'value-label-end' }) valueLabelEnd = '';
  @property({ attribute: 'aria-label-start' }) ariaLabelStart = '';
  @property({ attribute: 'aria-valuetext-start' }) ariaValueTextStart = '';
  @property({ attribute: 'aria-label-end' }) ariaLabelEnd = '';
  @property({ attribute: 'aria-valuetext-end' }) ariaValueTextEnd = '';
  @property({ type: Number }) step = 1;
  @property({ type: Boolean }) ticks = false;
  @property({ type: Boolean }) labeled = false;
  @property({ type: Boolean }) range = false;

  get nameStart() {
    return this.getAttribute('name-start') ?? this.name ?? '';
  }
  set nameStart(name: string) {
    this.setAttribute('name-start', name);
  }

  get nameEnd() {
    return this.getAttribute('name-end') ?? this.nameStart;
  }
  set nameEnd(name: string) {
    this.setAttribute('name-end', name);
  }

  @query('input.start') protected readonly inputStart!: HTMLInputElement | null;
  @query('input.end') protected readonly inputEnd!: HTMLInputElement | null;
  @query('.handle.start')
  protected readonly handleStart!: HTMLDivElement | null;
  @query('.handle.end') protected readonly handleEnd!: HTMLDivElement | null;

  @state() protected startOnTop = false;
  @state() protected handlesOverlapping = false;
  @state() protected renderValueStart?: number;
  @state() protected renderValueEnd?: number;

  protected get renderAriaLabelStart() {
    return (
      this.ariaLabelStart ||
      (this.ariaLabel && `${this.ariaLabel} start`) ||
      this.valueLabelStart ||
      String(this.valueStart)
    );
  }

  protected get renderAriaValueTextStart() {
    return (
      this.ariaValueTextStart || this.valueLabelStart || String(this.valueStart)
    );
  }

  protected get renderAriaLabelEnd() {
    if (this.range) {
      return (
        this.ariaLabelEnd ||
        (this.ariaLabel && `${this.ariaLabel} end`) ||
        this.valueLabelEnd ||
        String(this.valueEnd)
      );
    }
    return this.ariaLabel || this.valueLabel || String(this.value);
  }

  protected get renderAriaValueTextEnd() {
    if (this.range) {
      return (
        this.ariaValueTextEnd || this.valueLabelEnd || String(this.valueEnd)
      );
    }
    return this.ariaValueText || this.valueLabel || String(this.value);
  }

  protected renderInput({
    start,
    value,
    ariaLabel,
    ariaValueText,
    ariaMin,
    ariaMax,
  }: {
    start: boolean;
    value?: number;
    ariaLabel: string;
    ariaValueText: string;
    ariaMin: number;
    ariaMax: number;
  }) {
    const name = start ? `start` : `end`;
    return html`<input
      type="range"
      class="${classMap({
        start,
        end: !start,
      })}"
      @focus=${this.handleFocus}
      @pointerdown=${this.handleDown}
      @pointerup=${this.handleUp}
      @keydown=${this.handleKeydown}
      @keyup=${this.handleKeyup}
      @input=${this.handleInput}
      @change=${this.handleChange}
      id=${name}
      .disabled=${this.disabled}
      .min=${String(this.min)}
      aria-valuemin=${ariaMin}
      .max=${String(this.max)}
      aria-valuemax=${ariaMax}
      .step=${String(this.step)}
      .value=${String(value)}
      .tabIndex=${start ? 1 : 0}
      aria-label=${ariaLabel || nothing}
      aria-valuetext=${ariaValueText}
    />`;
  }

  private isRedispatchingEvent = false;
  private action?: Action;

  // @TODO: Delegate ARIA attributes to inputs, automatically convert from
  // aria-* to data-aria-*.
  @property({ attribute: 'data-aria-label' })
  override ariaLabel: string | null = null;
  @property({ attribute: 'data-aria-valuetext' })
  override ariaValueText: string | null = null;

  constructor() {
    super();
    // Activation click handling usually goes here if needed
    this.addEventListener('click', (event: MouseEvent) => {
      if (!isActivationClick(event) || !this.inputEnd) {
        return;
      }
      this.focus();
      dispatchActivationClick(this.inputEnd);
    });
  }

  override focus() {
    this.inputEnd?.focus();
  }

  protected override willUpdate(changed: PropertyValues) {
    this.renderValueStart = changed.has('valueStart')
      ? this.valueStart
      : this.inputStart?.valueAsNumber;

    const endValueChanged =
      (changed.has('valueEnd') && this.range) || changed.has('value');

    this.renderValueEnd = endValueChanged
      ? this.range
        ? this.valueEnd
        : this.value
      : this.inputEnd?.valueAsNumber;
  }

  protected override updated(changed: PropertyValues) {
    if (this.range) {
      this.renderValueStart = this.inputStart!.valueAsNumber;
    }
    this.renderValueEnd = this.inputEnd!.valueAsNumber;

    if (this.range) {
      const segment = (this.max - this.min) / 3;
      if (this.valueStart === undefined) {
        this.inputStart!.valueAsNumber = this.min + segment;
        const v = this.inputStart!.valueAsNumber;
        this.valueStart = this.renderValueStart = v;
      }
      if (this.valueEnd === undefined) {
        this.inputEnd!.valueAsNumber = this.min + 2 * segment;
        const v = this.inputEnd!.valueAsNumber;
        this.valueEnd = this.renderValueEnd = v;
      }
    } else {
      this.value ??= this.renderValueEnd;
    }

    if (
      changed.has('range') ||
      changed.has('renderValueStart') ||
      changed.has('renderValueEnd') ||
      this.isUpdatePending
    ) {
      const startNub = this.handleStart?.querySelector('.handleNub');
      const endNub = this.handleEnd?.querySelector('.handleNub');
      this.handlesOverlapping = isOverlapping(startNub, endNub);
    }

    this.updateFormValue();

    this.performUpdate();
  }

  // Event Handlers - Changed to protected for subclass template usage

  protected handleFocus(event: Event) {
    this.updateOnTop(event.target as HTMLInputElement);
  }

  protected handleKeydown(event: KeyboardEvent) {
    this.startAction(event);
  }

  protected handleKeyup(event: KeyboardEvent) {
    this.finishAction(event);
  }

  protected handleDown(event: PointerEvent) {
    this.startAction(event);
  }

  protected async handleUp(event: PointerEvent) {
    if (!this.action) {
      return;
    }

    const { target, values, flipped } = this.action;
    await new Promise(requestAnimationFrame);
    if (target !== undefined) {
      target.focus();
      if (flipped && target.valueAsNumber !== values.get(target)!) {
        target.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    this.finishAction(event);
  }

  protected handleInput(event: InputEvent) {
    if (this.isRedispatchingEvent) {
      return;
    }
    let stopPropagation = false;
    let redispatch = false;
    if (this.range) {
      if (this.isActionFlipped()) {
        stopPropagation = true;
        redispatch = this.flipAction();
      }
      if (this.clampAction()) {
        stopPropagation = true;
        redispatch = false;
      }
    }
    const target = event.target as HTMLInputElement;
    this.updateOnTop(target);
    if (this.range) {
      this.valueStart = this.inputStart!.valueAsNumber;
      this.valueEnd = this.inputEnd!.valueAsNumber;
    } else {
      this.value = this.inputEnd!.valueAsNumber;
    }
    if (stopPropagation) {
      event.stopPropagation();
    }
    if (redispatch) {
      this.isRedispatchingEvent = true;
      redispatchEvent(target, event);
      this.isRedispatchingEvent = false;
    }
  }

  protected handleChange(event: Event) {
    const changeTarget = event.target as HTMLInputElement;
    const { target, values } = this.action ?? {};
    const squelch =
      target && target.valueAsNumber === values!.get(changeTarget)!;
    if (!squelch) {
      redispatchEvent(this, event);
    }
    this.finishAction(event);
  }

  // Logic helpers

  private startAction(event: Event) {
    const target = event.target as HTMLInputElement;
    const fixed =
      target === this.inputStart ? this.inputEnd! : this.inputStart!;
    this.action = {
      canFlip: event.type === 'pointerdown',
      flipped: false,
      target,
      fixed,
      values: new Map([
        [target, target.valueAsNumber],
        [fixed, fixed?.valueAsNumber],
      ]),
    };
  }

  private finishAction(event: Event) {
    this.action = undefined;
  }

  private updateOnTop(input: HTMLInputElement) {
    this.startOnTop = input.classList.contains('start');
  }

  private needsClamping() {
    if (!this.action) {
      return false;
    }
    const { target, fixed } = this.action;
    const isStart = target === this.inputStart;
    return isStart
      ? target.valueAsNumber > fixed.valueAsNumber
      : target.valueAsNumber < fixed.valueAsNumber;
  }

  private isActionFlipped() {
    const { action } = this;
    if (!action) {
      return false;
    }
    const { target, fixed, values } = action;
    if (action.canFlip) {
      const coincident = values.get(target) === values.get(fixed);
      if (coincident && this.needsClamping()) {
        action.canFlip = false;
        action.flipped = true;
        action.target = fixed;
        action.fixed = target;
      }
    }
    return action.flipped;
  }

  private flipAction() {
    if (!this.action) {
      return false;
    }
    const { target, fixed, values } = this.action;
    const changed = target.valueAsNumber !== fixed.valueAsNumber;
    target.valueAsNumber = fixed.valueAsNumber;
    fixed.valueAsNumber = values.get(fixed)!;
    return changed;
  }

  private clampAction() {
    if (!this.needsClamping() || !this.action) {
      return false;
    }
    const { target, fixed } = this.action;
    target.valueAsNumber = fixed.valueAsNumber;
    return true;
  }

  // Form associated callbacks

  formResetCallback() {
    if (this.range) {
      const valueStart = this.getAttribute('value-start');
      this.valueStart = valueStart !== null ? Number(valueStart) : undefined;
      const valueEnd = this.getAttribute('value-end');
      this.valueEnd = valueEnd !== null ? Number(valueEnd) : undefined;
      return;
    }
    const value = this.getAttribute('value');
    this.value = value !== null ? Number(value) : undefined;
  }

  formStateRestoreCallback(state: string | Array<[string, string]> | null) {
    if (Array.isArray(state)) {
      const [[, valueStart], [, valueEnd]] = state;
      this.valueStart = Number(valueStart);
      this.valueEnd = Number(valueEnd);
      this.range = true;
      return;
    }
    this.value = Number(state);
    this.range = false;
  }

  // Use Internals for form value
  protected updateFormValue() {
    if (this.range) {
      const data = new FormData();
      data.append(this.nameStart, String(this.valueStart));
      data.append(this.nameEnd, String(this.valueEnd));
      this[internals].setFormValue(data);
    } else {
      this[internals].setFormValue(String(this.value));
    }
  }
}

function isOverlapping(
  elA: Element | null | undefined,
  elB: Element | null | undefined
) {
  if (!(elA && elB)) {
    return false;
  }
  const a = elA.getBoundingClientRect();
  const b = elB.getBoundingClientRect();
  return !(
    a.top > b.bottom ||
    a.right < b.left ||
    a.bottom < b.top ||
    a.left > b.right
  );
}

interface Action {
  canFlip: boolean;
  flipped: boolean;
  target: HTMLInputElement;
  fixed: HTMLInputElement;
  values: Map<HTMLInputElement | undefined, number | undefined>;
}

function isActivationClick(event: Event) {
  // Simple check for now, simplified version of material web's check
  // If it's a mouse event, primary button, bubbles etc.
  // Or just assume true if it reached here for now as placeholder description
  // In real impl this checks if the event invalidates activation (like bubbling from a label)
  return event.type === 'click';
}

function dispatchActivationClick(element: HTMLElement) {
  const event = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window,
  });
  element.dispatchEvent(event);
}

function redispatchEvent(element: Element, event: Event) {
  if (event.bubbles && (event.composed || event.defaultPrevented)) {
    const copy = new (event.constructor as new (
      type: string,
      eventInitDict?: EventInit
    ) => Event)(event.type, event);
    element.dispatchEvent(copy);
    return true;
  }
  const copy = new (event.constructor as new (
    type: string,
    eventInitDict?: EventInit
  ) => Event)(event.type, {
    bubbles: event.bubbles,
    cancelable: event.cancelable,
    composed: event.composed,
    // detail: (event as any).detail,
  });
  element.dispatchEvent(copy);
  return true;
}
