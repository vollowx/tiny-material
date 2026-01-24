import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { Switch } from '../base/switch.js';

import './focus-ring.js';
import { M3Ripple } from './ripple.js';

import { switchStyles } from './switch-styles.css.js';
import { targetStyles } from './target-styles.css.js';

function isRTL() {
  return document.documentElement.dir === 'rtl';
}

/**
 * @tag md-switch
 *
 * @csspart thumb
 * @csspart label
 */
@customElement('md-switch')
export class M3Switch extends Switch {
  static override styles = [targetStyles, switchStyles];
  override render() {
    return html`
      <md-focus-ring></md-focus-ring>
      <div part="thumb">
        <md-ripple spacebehavior="always"></md-ripple>
        <span part="target"></span>
        ${this.renderOffIcon()}${this.renderOnIcon()}
      </div>
    `;
  }
  renderOnIcon() {
    return html`
      <svg part="icons icon-on" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M9.55 18.2 3.65 12.3 5.275 10.675 9.55 14.95 18.725 5.775 20.35 7.4Z"
        />
      </svg>
    `;
  }
  renderOffIcon() {
    return html`
      <svg part="icons icon-off" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6.4 19.2 4.8 17.6 10.4 12 4.8 6.4 6.4 4.8 12 10.4 17.6 4.8 19.2 6.4 13.6 12 19.2 17.6 17.6 19.2 12 13.6Z"
        />
      </svg>
    `;
  }

  @query('md-ripple') $ripple!: M3Ripple;
  @query('[part~="thumb"]') $thumb!: HTMLSpanElement;

  override connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => {
      this.$ripple.attach(this);
    });
    this.addEventListener('pointerdown', this.#handlePointerDown);
    this.addEventListener('pointerup', this.#handlePointerUp);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('pointerdown', this.#handlePointerDown);
    this.removeEventListener('pointerup', this.#handlePointerUp);
  }

  @property({ type: Boolean, reflect: true }) icons = false;
  @property({ type: Boolean, reflect: true }) checkedIconOnly = false;

  #pointerDownX = 0;

  #handlePointerDown = (e: PointerEvent) => {
    this._ignoreClick = false;

    if (e.button !== 0) return;
    this.#pointerDownX = e.clientX;
    this.setPointerCapture(e.pointerId);
    this.addEventListener('pointermove', this.#handlePointerMove);
  };

  #handlePointerMove = (e: PointerEvent) => {
    const diff = (isRTL() ? -1 : 1) * (e.clientX - this.#pointerDownX);

    this._ignoreClick = true;

    const limitedDiff = this.checked
      ? Math.min(0, Math.max(-20, diff))
      : Math.min(20, Math.max(0, diff));
    this.$thumb.style.setProperty(
      '--_thumb-diff-pointer',
      `${2 * limitedDiff}px`
    );
    // Thumb loses its `:active` status before pointer up event
    this.$thumb.style.setProperty('--_thumb-diameter', '28px');
    this.$thumb.style.transitionDuration = '0s';
  };

  #handlePointerUp = (e: PointerEvent) => {
    this.removeEventListener('pointermove', this.#handlePointerMove);
    this.releasePointerCapture(e.pointerId);

    const trackRect = this.getBoundingClientRect();
    const thumbRect = this.$thumb.getBoundingClientRect();
    const diff =
      thumbRect.left +
      thumbRect.width / 2 -
      trackRect.left -
      trackRect.width / 2;
    const shouldBeChecked = (diff >= 0 && !isRTL()) || (diff < 0 && isRTL());

    this.$thumb.style.setProperty('--_thumb-diff-pointer', '');
    this.$thumb.style.setProperty('--_thumb-diameter', '');
    this.$thumb.style.transitionDuration = '';

    if (this.checked != shouldBeChecked) this.toggleChecked();
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'md-switch': M3Switch;
  }
}
