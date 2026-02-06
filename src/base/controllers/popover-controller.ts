import { isServer, ReactiveController, ReactiveControllerHost } from 'lit';

import {
  internals,
  InternalsAttachedInterface,
} from '../mixins/internals-attached.js';

import {
  autoUpdate,
  computePosition,
  arrow,
  flip,
  offset,
  shift,
  MiddlewareData,
  Placement,
  Strategy,
} from '@floating-ui/dom';

export function transformOriginFromArrow(
  placement: Placement,
  arrowData?: MiddlewareData['arrow']
): string {
  const { x: arrowX, y: arrowY } = arrowData || {};
  const [side] = placement.split('-');

  let originX = '';
  let originY = '';

  if (side === 'top') {
    originX = arrowX != null ? `${arrowX}px` : 'center';
    originY = 'bottom';
  } else if (side === 'bottom') {
    originX = arrowX != null ? `${arrowX}px` : 'center';
    originY = 'top';
  } else if (side === 'left') {
    originX = 'right';
    originY = arrowY != null ? `${arrowY}px` : 'center';
  } else if (side === 'right') {
    originX = 'left';
    originY = arrowY != null ? `${arrowY}px` : 'center';
  }

  return `${originX} ${originY}`;
}

export interface PopoverControllerConfig {
  popover: () => HTMLElement | null;
  trigger: () => HTMLElement | null;
  positioning: {
    placement: () => Placement;
    strategy: () => Strategy;
    offset: () => number;
    windowPadding: () => number;
  };
  durations: {
    open: () => number;
    close: () => number;
  };
  onClickAway?: () => void;
}

export class PopoverController implements ReactiveController {
  host: ReactiveControllerHost & InternalsAttachedInterface;

  private readonly config: PopoverControllerConfig;

  private _open = false;
  get open() {
    return this._open;
  }

  private cleanupAutoUpdate?: () => void;

  constructor(
    host: ReactiveControllerHost & InternalsAttachedInterface,
    config: PopoverControllerConfig
  ) {
    (this.host = host).addController(this);
    this.config = config;
  }

  hostConnected() {
    // Initial state
    if (!this._open) {
      this.host[internals].states.add('closed');
    }
  }
  hostDisconnected() {
    this.cleanupAutoUpdate?.();
    window.removeEventListener('pointerup', this.#handleClickAway);
  }

  // Different from those in the Tooltip, these timers are used to manage the
  // animation timing.
  #openTimer: NodeJS.Timeout = null;
  #closeTimer: NodeJS.Timeout = null;

  async animateOpen() {
    if (this._open) return;
    this._open = true;
    // Prevent the click that triggered the open from immediately closing it
    // TODO: Use a global event listener to manage this more effectively
    setTimeout(() => {
      if (this._open) {
        window.addEventListener('pointerup', this.#handleClickAway);
      }
    }, 0);

    clearTimeout(this.#openTimer);
    clearTimeout(this.#closeTimer);

    const openDuration = this.config.durations.open();

    this.host[internals].states.delete('closed');
    this.host[internals].states.delete('closing');

    const trigger = this.config.trigger();
    const popover = this.config.popover();

    if (trigger && popover) {
      this.cleanupAutoUpdate?.();
      this.cleanupAutoUpdate = autoUpdate(trigger, popover, () =>
        this.reposition()
      );
      // Initial position
      await this.reposition();
    }

    if (openDuration === 0) {
      this.host[internals].states.add('opened');
    } else {
      // Wait for a frame to ensure the element is rendered with base styles
      // e.g. (opacity 0) before adding the opening state e.g. (opacity 1) to
      // trigger transition.
      requestAnimationFrame(() => {
        if (this._open) {
          this.host[internals].states.add('opening');
        }
      });

      this.#openTimer = setTimeout(() => {
        this.host[internals].states.delete('opening');
        this.host[internals].states.add('opened');
      }, openDuration);
    }
  }

  async animateClose() {
    if (!this._open) return;
    this._open = false;

    window.removeEventListener('pointerup', this.#handleClickAway);
    clearTimeout(this.#openTimer);
    clearTimeout(this.#closeTimer);

    const closeDuration = this.config.durations.close();
    const wasOpened = this.host[internals].states.has('opened');

    this.host[internals].states.delete('opened');
    this.host[internals].states.delete('opening');

    if (closeDuration === 0 || !wasOpened) {
      this.cleanup();
      this.host[internals].states.delete('closing');
      this.host[internals].states.add('closed');
    } else {
      this.host[internals].states.add('closing');

      this.#closeTimer = setTimeout(() => {
        this.cleanup();
        this.host[internals].states.delete('closing');
        this.host[internals].states.add('closed');
      }, closeDuration);
    }
  }

  private cleanup() {
    this.cleanupAutoUpdate?.();
    this.cleanupAutoUpdate = undefined;
  }

  // TODO: Provide the ability to specify an arrow element.
  private _dummyArrow = isServer ? null : document.createElement('div');

  reposition() {
    const trigger = this.config.trigger();
    const popover = this.config.popover();

    if (!trigger || !popover) return Promise.resolve();

    return computePosition(trigger, popover, {
      placement: this.config.positioning.placement(),
      strategy: this.config.positioning.strategy(),
      middleware: [
        offset(this.config.positioning.offset()),
        flip({ padding: this.config.positioning.windowPadding() }),
        shift({
          padding: this.config.positioning.windowPadding(),
          crossAxis: true,
        }),
        arrow({ element: this._dummyArrow }),
      ],
    }).then(({ x, y, placement, middlewareData }) => {
      Object.assign(popover.style, {
        left: `${x}px`,
        top: `${y}px`,
        transformOrigin: transformOriginFromArrow(
          placement,
          middlewareData.arrow
        ),
      });
    });
  }

  #handleClickAway = (event: MouseEvent) => {
    const trigger = this.config.trigger();
    const popover = this.config.popover();
    const path = event.composedPath();

    if (trigger && path.includes(trigger)) return;
    if (popover && path.includes(popover)) return;

    this.config.onClickAway?.();
  };
}
