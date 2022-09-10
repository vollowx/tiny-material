import { css } from '../shared/template.js';
import Popover from '../popover/popover.js';
import List from '../list/list.js';
import ListItem from '../list/list-item.js';

const MenuStyle = css`
  :host {
    z-index: 1000;
    --md-list-padding: 8px 0;
  }
  [part~='popover'] {
    overflow-x: hidden;
  }
  [part~='menu'] {
    position: fixed;
    min-width: 112px;
    max-width: 280px;
    max-height: var(--md-menu-max-height, calc(100vh - 96px));
    overflow-y: auto;
    background: var(--md-sys-elevation-surface-2);
    box-shadow: var(--md-sys-elevation-shadow-2);
    transform: scale(0.9);
    opacity: 0;
    border-radius: 4px;
    z-index: 1000;
    pointer-events: none;
  }
  [part~='overlay'] {
    position: fixed;
    inset: 0;
    pointer-events: auto;
    visibility: hidden;
    -webkit-tap-highlight-color: transparent;
    z-index: 1000;
  }
  :host([open]) [part~='overlay'] {
    visibility: visible;
  }
  :host(:not([fast])[animate]) [part~='menu'] {
    transition: 120ms transform cubic-bezier(0.4, 0, 0.2, 1) 120ms, 120ms opacity cubic-bezier(0.4, 0, 0.2, 1);
  }
  :host([open]) [part~='menu'] {
    transform: scale(1);
    opacity: 1;
    pointer-events: auto;
    transition-delay: 0ms, 0ms !important;
  }
  :host([normal]) {
    --md-list-item-height: 48px;
  }
  :host([dense]) {
    --md-list-item-height: 36px;
  }
`;

/** @type {Menu[]} */
var allMenus = [];
window.addEventListener('resize', () => {
  allMenus.forEach((menu) => {
    menu.setPosition();
  });
});

export default class Menu extends Popover {
  static get is() {
    return 'md-menu';
  }

  /** @override */
  focus() {
    this.listElement.focus();
  }

  /** @type {List} */
  get listElement() {
    return this.getEl('[part~="list"]');
  }
  /** @type {ListItem[]} */
  get itemElements() {
    // @ts-ignore
    return [...this.querySelectorAll('md-list-item')];
  }

  get _styles() {
    return [...super._styles, MenuStyle];
  }
  _renderContents() {
    return /* html */ `<md-list data-role="menu" tabindex="-1" part="list"><slot></slot></md-list>`;
  }

  /**
   * @param {boolean} assigned if user assigned a menuitem, ignore selected menuitem
   */
  open(assigned = false) {
    if (!this.anchorElement) {
      this.anchorErr();
      return;
    }
    super.open();
    this.anchorElement.setAttribute('aria-controls', this.listElement.id);
    assigned ? null : this.listElement.updateFocus();
  }
  close() {
    if (!this.anchorElement) {
      this.anchorErr();
      return;
    }
    super.close();
    this.anchorElement.setAttribute('aria-controls', '');
    this.itemElements.forEach((item) => {
      item.removeAttribute('focus-from');
      item.rippleElement.removeAllRipples();
    });
  }
  /**
   * @param {KeyboardEvent} _ev
   */
  handleAnchorKeyDown(_ev) {
    let flag = false;

    const { key } = _ev;
    switch (key) {
      case 'Enter':
      case ' ':
        flag = true;
        this.open(false);
        break;

      case 'ArrowDown':
      case 'Down':
        flag = true;
        this.open(true);
        this.listElement.focusFirst();
        break;

      case 'ArrowUp':
      case 'Up':
        flag = true;
        this.open(true);
        this.listElement.focusLast();
        break;

      default:
        break;
    }

    if (flag) {
      _ev.preventDefault();
      _ev.stopPropagation();
    }
  }
  /**
   * @param {MouseEvent} _ev
   */
  handleClick(_ev) {
    let close = false;
    /** @type {List|ListItem} */
    // @ts-ignore
    const target = _ev.target;
    if (target.tagName === 'MD-LIST-ITEM' && !target.hasAttribute('disabled')) {
      close = true;
    }
    if (target.tagName === 'MD-LIST') {
      // For ARIA menu closing
      close = true;
    }
    if (close) {
      this.close();
    }
  }

  initARIA() {
    if (!this.anchorElement) {
      this.anchorErr();
      return;
    }

    super.initARIA();
    this.listElement.id = `${this.anchorElement.id}-menu`;
    this.listElement.setAttribute('aria-labelby', this.anchorElement.id);
    this.itemElements.forEach((item) => {
      item.innerElement.id = `${this.anchorElement?.id}-item-${[...this.itemElements].indexOf(item)}`;
    });
  }

  connectedCallback() {
    if (!this.anchorElement) {
      this.anchorErr();
      return;
    }
    super.connectedCallback();
    this.anchorElement.addEventListener('keydown', this.handleAnchorKeyDown.bind(this));
    this.listElement.addEventListener('click', this.handleClick.bind(this));
    this.listElement.itemsContainer = () => {
      return this;
    };
    this.listElement.scrollContainer = () => {
      return this.popoverElement;
    };

    allMenus.push(this);
  }
}

customElements.define(Menu.is, Menu);
