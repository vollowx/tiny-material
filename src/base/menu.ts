import { LitElement, html } from 'lit';
import { property, query } from 'lit/decorators.js';

import { setFocusVisible } from '../core/focus-visible.js';
import { Attachable } from './mixins/attachable.js';
import { internals, InternalsAttached } from './mixins/internals-attached.js';
import { PopoverController } from './controllers/popover-controller.js';
import { ListController } from './controllers/list-controller.js';
import { MenuItem } from './menu-item.js';
import {
  MenuActions,
  getActionFromKey,
  getUpdatedIndex,
  scrollItemIntoView,
} from './menu-utils.js';

const Base = InternalsAttached(Attachable(LitElement));

/**
 * @csspart menu
 * @csspart items
 *
 * @fires {Event} menu-item-selected
 */
export class Menu extends Base {
  readonly _possibleItemTags: string[] = [];
  readonly _durations = { show: 0, hide: 0 };
  readonly _scrollPadding: number = 0;

  @property({ type: Boolean, reflect: true }) open: boolean = false;
  @property({ type: Boolean, reflect: true }) quick: boolean = false;
  @property({ reflect: true }) align: import('@floating-ui/dom').Placement =
    'bottom-start';
  @property({ type: String, reflect: true })
  alignStrategy: import('@floating-ui/dom').Strategy = 'absolute';
  @property({ type: Number, reflect: true }) offset = 0;
  @property({ type: Boolean }) keepOpenBlur: boolean = false;
  @property({ type: Boolean }) keepOpenClickItem: boolean = false;
  @property({ type: Boolean }) keepOpenClickOutside: boolean = false;

  @query('[part="menu"]') $menu!: HTMLElement;
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
  });

  private readonly listController = new ListController<MenuItem>(this, {
    isItem: (item: HTMLElement): item is MenuItem =>
      this._possibleItemTags.includes(item.tagName.toLowerCase()) &&
      !item.hasAttribute('disabled'),
    getPossibleItems: () =>
      Array.from(this.children).filter(
        (child): child is MenuItem =>
          this._possibleItemTags.includes(child.tagName.toLowerCase()) &&
          !child.hasAttribute('disabled')
      ),
    blurItem: (item: MenuItem) => {
      item.focused = false;
    },
    focusItem: (item: MenuItem) => {
      item.focused = true;
      // this[internals].ariaActiveDescendantElement = item;
      // Somehow setting ariaActiveDescendantElement doesn't actually update it
      this.setAttribute('aria-activedescendant', item.id);
      scrollItemIntoView(this.$menu, item, this._scrollPadding);
    },
    wrapNavigation: () => false,
  });

  constructor() {
    super();
    this[internals].role = 'menu';
    this.tabIndex = -1;
  }

  override render() {
    return html`<div part="menu">${this.renderItemSlot()}</div>`;
  }

  renderItemSlot() {
    return html`<slot part="items"></slot>`;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keydown', this.#handleKeyDown.bind(this));
    this.addEventListener('focusout', this.#handleFocusOut.bind(this));
    if (this.$control) {
      // TODO: Handle $control change
      this.$control.ariaHasPopup = 'true';
      this.$control.ariaExpanded = 'false';
      this.$control.ariaControlsElements = [this];
      this[internals].ariaLabelledByElements = [this.$control];
      this.$control.addEventListener(
        'focusout',
        this.#handleFocusOut.bind(this)
      );
    }
    this.listController.items.forEach((item) => {
      item.addEventListener('mouseover', this.#handleItemMouseOver.bind(this));
      item.addEventListener('click', this.#handleItemClick.bind(this));
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.#handleKeyDown.bind(this));
    this.removeEventListener('focusout', this.#handleFocusOut.bind(this));
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
        this.$lastFocused = document.activeElement as HTMLElement;
        if (this.$control) {
          this.$control.ariaExpanded = 'true';
        }

        this.popoverController.animateOpen().then(() => {
          this.focus();
          this.listController.focusFirstItem();
        });
      } else {
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
            new CustomEvent('menu-item-selected', {
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
      new CustomEvent('menu-item-selected', {
        detail: {
          item: this.listController.items[index],
          index: index,
        },
        bubbles: true,
        composed: true,
      })
    );

    if (this.keepOpenClickItem) return;
    this.open = false;
  }

  // Exposed functions
  show() {
    this.open = true;
  }
  close() {
    this.open = false;
  }
}
