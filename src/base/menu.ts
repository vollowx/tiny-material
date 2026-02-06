import { LitElement, html } from 'lit';
import { property, query, queryAssignedElements } from 'lit/decorators.js';

import type { Placement, Strategy } from '@floating-ui/dom';

import { setFocusVisible } from '../core/focus-visible.js';
import { Attachable } from './mixins/attachable.js';
import { InternalsAttached } from './mixins/internals-attached.js';
import { FocusDelegated } from './mixins/focus-delegated.js';
import { PopoverController } from './controllers/popover-controller.js';
import { ListController } from './controllers/list-controller.js';
import { MenuItem } from './menu-item.js';
import {
  MenuActions,
  getActionFromKey,
  getUpdatedIndex,
  scrollItemIntoView,
} from './menu-utils.js';

const Base = FocusDelegated(InternalsAttached(Attachable(LitElement)));

/**
 * @csspart menu
 * @csspart items
 *
 * @fires {Event} select - Fired when a menu item has been selected.
 * @fires {Event} open - Fired when the menu is opened.
 * @fires {Event} close - Fired when the menu is closed.
 */
export class Menu extends Base {
  readonly _possibleItemTags: string[] = [];
  readonly _durations = { show: 0, hide: 0 };
  readonly _scrollPadding: number = 0;

  @property() type: string = 'menu';
  @property({ type: Boolean }) open = false;
  @property({ type: Boolean }) quick = false;
  @property({ type: Number }) offset = 0;
  @property({ reflect: true })
  align: Placement = 'bottom-start';
  @property({ type: String, reflect: true, attribute: 'align-strategy' })
  alignStrategy: Strategy = 'absolute';
  @property({ type: Boolean, attribute: 'keep-open-blur' })
  keepOpenBlur: boolean = false;
  @property({ type: Boolean, attribute: 'keep-open-click-item' })
  keepOpenClickItem: boolean = false;
  @property({ type: Boolean, attribute: 'keep-open-click-away' })
  keepOpenClickAway: boolean = false;

  @query('[part="menu"]') $menu!: HTMLElement;
  @queryAssignedElements({ flatten: true }) slotItems!: Array<
    MenuItem | HTMLElement
  >;
  private $lastFocused: HTMLElement | null = null;

  private readonly popoverController = new PopoverController(this, {
    popover: () => this.$menu,
    trigger: () => this.$control,
    positioning: {
      placement: () => this.align,
      strategy: () => this.alignStrategy,
      offset: () => this.offset,
      windowPadding: () => 16,
    },
    durations: {
      open: () => (this.quick ? 0 : this._durations.show),
      close: () => (this.quick ? 0 : this._durations.hide),
    },
    onClickAway: () => {
      if (!this.keepOpenClickAway) this.open = false;
    },
  });

  private readonly listController = new ListController<MenuItem>(this, {
    isItem: (item: HTMLElement): item is MenuItem =>
      this._possibleItemTags.includes(item.tagName.toLowerCase()) &&
      !item.hasAttribute('disabled'),
    getPossibleItems: () => this.slotItems,
    blurItem: (item: MenuItem) => {
      item.focused = false;
    },
    focusItem: (item: MenuItem) => {
      item.focused = true;
      this.$menu.setAttribute('aria-activedescendant', item.id);
      scrollItemIntoView(this.$menu, item, this._scrollPadding);
    },
    wrapNavigation: () => false,
  });

  override render() {
    return html`<div
      part="menu"
      role="${this.type}"
      tabindex="0"
      @keydown=${this.#handleKeyDown.bind(this)}
      @focusout=${this.#handleFocusOut.bind(this)}
    >
      ${this.renderItemSlot()}
    </div>`;
  }

  renderItemSlot() {
    return html`<slot part="items"></slot>`;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.$control) {
      // TODO: Manage $control ARIA attributes
      // TODO: Handle $control change
      this.$control.addEventListener(
        'focusout',
        this.#handleFocusOut.bind(this)
      );
    }
    this.updateComplete.then(() => {
      this.listController.items.forEach((item) => {
        item.addEventListener(
          'mouseover',
          this.#handleItemMouseOver.bind(this)
        );
        item.addEventListener('click', this.#handleItemClick.bind(this));
      });
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.$control) {
      this.$control.removeEventListener(
        'focusout',
        this.#handleFocusOut.bind(this)
      );
    }
  }

  protected override updated(changed: Map<string, any>) {
    if (changed.has('open')) {
      if (this.open) {
        this.dispatchEvent(
          new Event('open', { bubbles: true, composed: true })
        );

        this.$lastFocused = document.activeElement as HTMLElement;
        if (this.$control) {
          this.$control.ariaExpanded = 'true';
        }

        this.popoverController.animateOpen().then(() => {
          this.$menu.focus();
          this.listController.focusFirstItem();
        });
      } else {
        this.dispatchEvent(
          new Event('close', { bubbles: true, composed: true })
        );

        this.listController.clearSearch();

        if (this.$control) {
          this.$control.ariaExpanded = 'false';
        }

        this.popoverController.animateClose().then(() => {
          if (this.$lastFocused) {
            this.$lastFocused.focus();
            this.$lastFocused = null;
          }
        });
      }
    }
  }

  #handleKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;

    const action = getActionFromKey(event, this.open);
    const items = this.listController.items;
    const currentIndex = this.listController.currentIndex;
    const maxIndex = items.length - 1;

    switch (action) {
      case MenuActions.Last:
      case MenuActions.First:
        this.open = true;
      // intentional fallthrough
      case MenuActions.Next:
      case MenuActions.Previous:
      case MenuActions.PageUp:
      case MenuActions.PageDown:
        event.preventDefault();
        const nextIndex = getUpdatedIndex(currentIndex, maxIndex, action!);
        this.listController._focusItem(items[nextIndex]);
        return;
      case MenuActions.CloseSelect:
        event.preventDefault();
        if (currentIndex >= 0) {
          this.listController.items[currentIndex].focused = false;
          this.dispatchEvent(
            new CustomEvent('select', {
              detail: {
                item: this.listController.items[currentIndex],
                index: currentIndex,
              },
              bubbles: true,
              composed: true,
            })
          );
          if (this.keepOpenClickItem) return;
          this.open = false;
        }
        return;
      case MenuActions.Close:
        event.preventDefault();
        this.open = false;
        return;
      case MenuActions.Type:
        this.open = true;
        this.listController.handleType(event.key);
        return;
      case MenuActions.Open:
        event.preventDefault();
        this.open = true;
        return;
    }
  }

  #handleFocusOut(event: FocusEvent) {
    if (this.keepOpenBlur) return;
    const newFocus = event.relatedTarget as Node;
    const isInside =
      this.contains(newFocus) ||
      this.shadowRoot?.contains(newFocus) ||
      this.$control?.contains(newFocus);
    if (!isInside) {
      this.open = false;
    }
  }

  #handleItemMouseOver(event: Event) {
    setFocusVisible(false);
    const hoveredItem = event.currentTarget as MenuItem;
    this.listController._focusItem(hoveredItem);
  }

  #handleItemClick(event: Event) {
    const clickedItem = event.currentTarget as MenuItem;
    const index = this.listController.items.indexOf(clickedItem);

    this.listController.items[index].focused = false;
    this.dispatchEvent(
      new CustomEvent('select', {
        detail: {
          item: clickedItem,
          index: index,
        },
        bubbles: true,
        composed: true,
      })
    );

    if (!this.keepOpenClickItem) this.open = false;
  }

  show() {
    this.open = true;
  }
  close() {
    this.open = false;
  }
}
