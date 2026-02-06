import { LitElement, isServer, html, PropertyValues } from 'lit';
import { property, query, queryAssignedElements } from 'lit/decorators.js';

import { InternalsAttached } from './mixins/internals-attached.js';
import { FocusDelegated } from './mixins/focus-delegated.js';
import { FormAssociated } from './mixins/form-associated.js';
import { PopoverController } from './controllers/popover-controller.js';
import { ListController } from './controllers/list-controller.js';

import { Option } from './option.js';
import {
  MenuActions,
  getActionFromKey,
  getUpdatedIndex,
  scrollItemIntoView,
} from './menu-utils.js';

const VALUE = Symbol('value');

const Base = FormAssociated(FocusDelegated(InternalsAttached(LitElement)));

/**
 * @csspart field
 * @csspart menu
 * @csspart items
 *
 * @fires {Event} change - Fired when the selected value has changed.
 * @fires {Event} input - Fired when the selected value has changed.
 *
 * TODO: Consider handle mouseover to focus items.
 */
export class Select extends Base {
  readonly _possibleItemTags: string[] = [];
  readonly _durations = { show: 0, hide: 0 };
  readonly _scrollPadding: number = 0;

  @property({ type: Boolean }) quick = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) error = false;
  @property({ reflect: true }) align: import('@floating-ui/dom').Placement =
    'bottom-start';
  @property({ type: String, reflect: true })
  alignStrategy: import('@floating-ui/dom').Strategy = 'absolute';
  @property({ type: Number, reflect: true }) offset = 0;

  /**
   * Text to display in the field. Only set for SSR.
   */
  @property({ attribute: 'display-text' }) displayText = '';

  @property()
  get value(): string {
    return this[VALUE];
  }
  set value(value: string) {
    if (isServer) return;
    this.lastUserSetValue = value;
    this.select(value);
  }

  [VALUE] = '';

  get options() {
    return this.listController.items;
  }

  @property({ type: Number, attribute: 'selected-index' })
  get selectedIndex(): number {
    const selectedOptions = this.getSelectedOptions() ?? [];
    if (selectedOptions.length > 0) {
      return selectedOptions[0][1];
    }
    return -1;
  }

  set selectedIndex(index: number) {
    this.lastUserSetSelectedIndex = index;
    this.selectIndex(index);
  }

  get selectedOptions() {
    return (this.getSelectedOptions() ?? []).map(([option]) => option);
  }

  @property({ type: Boolean, reflect: true }) open = false;

  @query('[part="field"]') $field!: HTMLElement;
  @query('[part="menu"]') $menu!: HTMLElement;
  @queryAssignedElements({ flatten: true }) slotItems!: Array<
    Option | HTMLElement
  >;

  private lastUserSetValue: string | null = null;
  private lastUserSetSelectedIndex: number | null = null;
  private lastSelectedOption: Option | null = null;
  private lastSelectedOptionRecords: [Option, number][] = [];

  private readonly popoverController = new PopoverController(this, {
    popover: () => this.$menu,
    trigger: () => this.$field,
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
    onClickOutside: () => {
      this.open = false;
    },
  });

  protected readonly listController = new ListController<Option>(this, {
    isItem: (item: HTMLElement): item is Option =>
      this._possibleItemTags.includes(item.tagName.toLowerCase()) &&
      !item.hasAttribute('disabled'),
    getPossibleItems: () => this.slotItems,
    blurItem: (item: Option) => {
      item.focused = false;
    },
    focusItem: (item: Option) => {
      item.focused = true;
      if (this.$field && item.id) {
        this.$field.setAttribute('aria-activedescendant', item.id);
      }
      scrollItemIntoView(this.$menu, item, this._scrollPadding);
    },
    wrapNavigation: () => false,
  });

  constructor() {
    super();

    if (!isServer) {
      this.addEventListener('focusout', this.#handleFocusOut);
      this.addEventListener('click', this.#handleOptionClick);
    }
  }

  protected override async firstUpdated(changed: PropertyValues<Select>) {
    // If this has been handled on update already due to SSR, try again.
    if (!this.lastSelectedOptionRecords.length) {
      this.initUserSelection();
    }

    // Case for when the DOM is streaming, there are no children, and a child
    // has [selected] set on it, we need to wait for DOM to render something.
    if (
      !this.lastSelectedOptionRecords.length &&
      !isServer &&
      !this.options.length
    ) {
      setTimeout(() => {
        this.updateValueAndDisplayText();
      }, 0);
    }

    super.firstUpdated(changed);
  }

  protected override update(changed: PropertyValues<Select>) {
    if (!this.hasUpdated) {
      this.initUserSelection();
    }

    super.update(changed);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);

    if (changed.has('open')) {
      if (this.open) {
        this.popoverController.animateOpen();
        this.#focusSelectedItemOrFirst();
      } else {
        this.popoverController.animateClose();
        this.listController.clearSearch();
      }
    }
  }

  override render() {
    return html`${this.renderField()} ${this.renderMenu()}`;
  }

  protected renderField() {
    return html`
      <div
        part="field"
        @click=${this.toggle}
        @keydown=${this.handleFieldKeydown}
        tabindex=${this.disabled ? '-1' : '0'}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded=${this.open}
        aria-controls="menu"
        aria-disabled=${this.disabled}
        aria-required=${this.required}
      >
        ${this.renderFieldContent()}
      </div>
    `;
  }

  protected renderMenu() {
    return html`
      <div part="menu" id="menu" role="listbox" tabindex="-1">
        <slot part="items" @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
  }

  protected renderFieldContent() {
    return html`<span part="value">${this.displayText || html`&nbsp;`}</span>`;
  }

  protected handleFieldKeydown(event: KeyboardEvent) {
    if (this.disabled) return;

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
        if (this.selectItem(items[currentIndex])) {
          this.#dispatchChangeEvent();
        }
      // intentional fallthrough
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

  private selectItem(item: Option) {
    const selectedOptions = this.getSelectedOptions() ?? [];
    selectedOptions.forEach(([option]) => {
      if (item !== option) {
        option.selected = false;
      }
    });
    item.selected = true;

    return this.updateValueAndDisplayText();
  }

  private initUserSelection() {
    if (this.lastUserSetValue && !this.lastSelectedOptionRecords.length) {
      this.select(this.lastUserSetValue);
    } else if (
      this.lastUserSetSelectedIndex !== null &&
      !this.lastSelectedOptionRecords.length
    ) {
      this.selectIndex(this.lastUserSetSelectedIndex);
    } else {
      this.updateValueAndDisplayText();
    }
  }

  private updateValueAndDisplayText() {
    const selectedOptions = this.getSelectedOptions() ?? [];
    let changed = false;

    if (selectedOptions.length) {
      const [firstSelectedOption] = selectedOptions[0];
      changed = this.lastSelectedOption !== firstSelectedOption;
      this.lastSelectedOption = firstSelectedOption;
      this[VALUE] = firstSelectedOption.value;
      this.displayText = firstSelectedOption.displayText;
    } else {
      changed = this.lastSelectedOption !== null;
      this.lastSelectedOption = null;
      this[VALUE] = '';
      // Keep displayText if it was set (e.g., from SSR) and options aren't available yet.
      if (this.options.length === 0 && this.displayText) {
        return changed;
      }
      this.displayText = '';
    }

    return changed;
  }

  private getSelectedOptions(): [Option, number][] | null {
    const items = this.listController.items;
    const records: [Option, number][] = [];
    items.forEach((item, index) => {
      if (item.selected) {
        records.push([item, index]);
      }
    });
    this.lastSelectedOptionRecords = records;
    return records.length ? records : null;
  }

  #dispatchChangeEvent = () => {
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };

  #handleOptionClick = (event: Event) => {
    const target = event.target as HTMLElement;
    const item = target.closest(this._possibleItemTags.join(',')) as Option;
    if (item && this.listController.items.includes(item)) {
      if (this.selectItem(item)) {
        this.#dispatchChangeEvent();
      }
      this.open = false;
    }
  };

  #handleFocusOut = (event: FocusEvent) => {
    const relatedTarget = event.relatedTarget as Node;
    if (!this.contains(relatedTarget) && !this.$menu.contains(relatedTarget)) {
      this.open = false;
    }
  };

  #focusSelectedItemOrFirst() {
    const selectedOptions = this.getSelectedOptions();
    if (selectedOptions && selectedOptions.length > 0) {
      const [item] = selectedOptions[0];
      this.listController._focusItem(item);
    } else {
      this.listController.focusFirstItem();
    }
  }

  protected handleSlotChange() {
    // When slots change, check for initially selected items if value is not set
    if (!this.value) {
      this.updateValueAndDisplayText();
    }
  }

  formResetCallback() {
    this.reset();
  }

  formStateRestoreCallback(state: string) {
    this.value = state;
  }

  select(value: string) {
    const item = this.options.find((option) => option.value === value);
    if (item) {
      this.selectItem(item);
    }
  }

  selectIndex(index: number) {
    const item = this.options[index];
    if (item) {
      this.selectItem(item);
    }
  }

  reset() {
    for (const option of this.options) {
      option.selected = option.hasAttribute('selected');
    }
    this.updateValueAndDisplayText();
  }

  toggle() {
    if (this.disabled) return;
    this.open = !this.open;
  }
}
