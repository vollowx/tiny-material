import { LitElement, html } from 'lit';
import { property, query } from 'lit/decorators.js';

import { focusVisible } from '../core/focus-visible.js';
import { Attachable } from './mixins/attachable.js';
import { InternalsAttached, internals } from './mixins/internals-attached.js';
import { PopoverController } from './controllers/popover-controller.js';

let lastHidingTime = 0;

const Base = Attachable(InternalsAttached(LitElement));

/**
 * TODO: Check if $control controls a menu/popover and keep hidden when it is open.
 */
export class Tooltip extends Base {
  readonly _delays = {
    mouse: { show: 500, hide: 0 },
    focus: { show: 100, hide: 0 },
    touch: { show: 700, hide: 1500 },
    recentlyShowed: 800,
  };
  readonly _durations = { show: 100, hide: 100 };

  @property({ reflect: true }) align: import('@floating-ui/dom').Placement =
    'top';
  @property({ type: Number, reflect: true }) offset = 4;
  @property({ type: Boolean, reflect: true }) forceInvisible = false;

  @query('slot') $slot: HTMLSlotElement;

  // Different from those in the popoverController, these timers are used to
  // manage the delay before showing/hiding the tooltip.
  #openTimer: NodeJS.Timeout = null;
  #closeTimer: NodeJS.Timeout = null;

  private readonly popoverController = new PopoverController(this, {
    popover: () => this,
    trigger: () => this.$control,
    positioning: {
      placement: () => this.align,
      strategy: () => 'absolute',
      offset: () => this.offset,
      windowPadding: () => 16,
    },
    durations: {
      open: () => this._durations.show,
      close: () => this._durations.hide,
    },
    onClickAway: () => {
      this.visible = false;
    },
  });

  constructor() {
    super();
    this[internals].role = 'tooltip';
  }

  override render() {
    return html`<slot @slotchange="${this.#handleSlotChange}"></slot>`;
  }

  override handleControlChange(
    prev: HTMLElement | null = null,
    next: HTMLElement | null = null
  ) {
    const eventHandlers = {
      focusin: this.#handleFocusIn,
      focusout: this.#handleFocusOut,
      pointerenter: this.#handlePointerEnter,
      pointerleave: this.#handlePointerLeave,
      touchstart: this.#handleTouchStart,
      touchend: this.#handleTouchEnd,
    };

    Object.keys(eventHandlers).forEach((key) => {
      prev?.removeEventListener(key, eventHandlers[key]);
      next?.addEventListener(key, eventHandlers[key]);
    });

    if (prev) prev.removeAttribute('aria-label');
    if (next) next.setAttribute('aria-label', this.textContent ?? '');
  }

  set visible(value: boolean) {
    if (value) {
      this.popoverController.animateOpen();
    } else {
      this.popoverController.animateClose();
    }
  }

  #handleSlotChange = () => {
    if (!this.visible)
      this.$control.setAttribute('aria-label', this.textContent ?? '');
  };

  #handleFocusIn = () => {
    if (!focusVisible) return;
    this.#show(this._delays.focus.show);
  };

  #handleFocusOut = () => {
    this.#hide(this._delays.focus.hide);
  };

  #handlePointerEnter = (e: Event) => {
    const evt = e as PointerEvent;
    if (evt.pointerType === 'touch') return;
    this.#show(this._delays.mouse.show);
  };

  #handlePointerLeave = (e: Event) => {
    const evt = e as PointerEvent;
    if (evt.pointerType === 'touch') return;
    this.#hide(this._delays.mouse.hide);
  };

  #handleTouchStart = () => {
    this.#show(this._delays.touch.show);
  };

  #handleTouchEnd = () => {
    this.#hide(this._delays.touch.hide);
  };

  #show(delay: number) {
    clearTimeout(this.#closeTimer);
    this.#openTimer = setTimeout(
      () => {
        this.visible = true;
      },
      Math.max(
        Date.now() - lastHidingTime < this._delays.recentlyShowed ? 0 : delay
      )
    );
  }

  #hide(delay: number) {
    if (this.popoverController.open) {
      lastHidingTime = Date.now();
    }
    clearTimeout(this.#openTimer);
    this.#closeTimer = setTimeout(() => {
      this.visible = false;
    }, delay);
  }
}
