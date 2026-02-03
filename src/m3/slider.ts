import { html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';

import { Slider } from '../base/slider.js';
import './focus-ring.js';

import { sliderStyles } from './slider-styles.css.js';

/**
 * @TODO: Add size variants
 * @TODO: Add orientation: vertical
 */
@customElement('md-slider')
export class M3Slider extends Slider {
  static override styles = [sliderStyles];

  override render() {
    const step = this.step === 0 ? 1 : this.step;
    const range = Math.max(this.max - this.min, step);
    const startFraction = this.range
      ? ((this.renderValueStart ?? this.min) - this.min) / range
      : 0;
    const endFraction = ((this.renderValueEnd ?? this.min) - this.min) / range;
    const containerStyles = {
      '--_start': String(startFraction),
      '--_end': String(endFraction),
      '--_ticks': String(range / step),
    };
    const containerClasses = { ranged: this.range };

    const labelStart = this.valueLabelStart || String(this.renderValueStart);
    const labelEnd =
      (this.range ? this.valueLabelEnd : this.valueLabel) ||
      String(this.renderValueEnd);

    const inputStartProps = {
      start: true,
      value: this.renderValueStart,
      ariaLabel: this.renderAriaLabelStart,
      ariaValueText: this.renderAriaValueTextStart,
      ariaMin: this.min,
      ariaMax: this.valueEnd ?? this.max,
    };

    const inputEndProps = {
      start: false,
      value: this.renderValueEnd,
      ariaLabel: this.renderAriaLabelEnd,
      ariaValueText: this.renderAriaValueTextEnd,
      ariaMin: this.range ? (this.valueStart ?? this.min) : this.min,
      ariaMax: this.max,
    };

    const handleStartProps = {
      start: true,
      label: labelStart,
    };

    const handleEndProps = {
      start: false,
      label: labelEnd,
    };

    return html` <div
      class="container ${classMap(containerClasses)}"
      style=${styleMap(containerStyles)}
    >
      ${when(this.range, () => this.renderInput(inputStartProps))}
      ${this.renderInput(inputEndProps)} ${this.renderTrack()}
      <div class="handles-padded">
        <div class="handles">
          ${when(this.range, () => this.renderHandle(handleStartProps))}
          ${this.renderHandle(handleEndProps)}
        </div>
      </div>
    </div>`;
  }

  private renderTrack() {
    return html`
      <div class="track">
        <div class="inactive-before"></div>
        <div class="active"></div>
        <div class="inactive-after"></div>
      </div>
      ${this.ticks
        ? html`
            <div class="tickmarks">
              <div class="inactive-before"></div>
              <div class="active"></div>
              <div class="inactive-after"></div>
            </div>
          `
        : nothing}
    `;
  }

  private renderLabel(value: string) {
    return html`<div class="label" aria-hidden="true">
      <span part="label">${value}</span>
    </div>`;
  }

  private renderHandle({ start, label }: { start: boolean; label: string }) {
    const onTop = !this.disabled && start === this.startOnTop;
    const isOverlapping = !this.disabled && this.handlesOverlapping;
    const name = start ? 'start' : 'end';
    return html`<div
      class="handle ${classMap({
        [name]: true,
        onTop,
        isOverlapping,
      })}"
    >
      <md-focus-ring part="focus-ring" for=${name}></md-focus-ring>
      <div class="nub"></div>
      ${when(this.labeled, () => this.renderLabel(label))}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'md-slider': M3Slider;
  }
}
