import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('sd-toolbar')
export class SdToolbar extends LitElement {
  static override styles = css`
    :host {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      padding: 16px;
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      z-index: 100;
    }
    md-icon {
      display: inline-block;
      font-family: 'Material Symbols Rounded';
      font-style: normal;
      font-weight: normal;
      letter-spacing: normal;
      line-height: 1;
      text-transform: none;
      white-space: nowrap;
      word-wrap: normal;
    }
  `;

  @property({ type: String }) githubUrl = 'https://github.com/vollowx/seele';
  @property({ type: Boolean }) rtl = false;

  @state() private themeMode: 'light' | 'dark' | 'auto' = 'auto';
  @state() private tooltipTexts = {
    rtl: ['Set direction to right-to-left', 'Set direction to left-to-right'],
  };

  private _prefersDarkQuery?: MediaQueryList;

  override connectedCallback() {
    super.connectedCallback();
    this._initializeDir();
    this._loadThemePreference();
    this._setupThemeListener();
    this._applyTheme();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this._prefersDarkQuery) {
      this._prefersDarkQuery.removeEventListener(
        'change',
        this._handleSystemThemeChange
      );
    }
  }

  private _initializeDir() {
    document.documentElement.dir = this.rtl ? 'rtl' : 'ltr';
  }

  private _loadThemePreference() {
    const stored = localStorage.getItem('sw-theme-preference');
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      this.themeMode = stored;
    }
  }

  private _saveThemePreference() {
    localStorage.setItem('sw-theme-preference', this.themeMode);
  }

  private _setupThemeListener() {
    this._prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._prefersDarkQuery.addEventListener(
      'change',
      this._handleSystemThemeChange
    );
  }

  private _handleSystemThemeChange = () => {
    if (this.themeMode === 'auto') {
      this._applyTheme();
    }
  };

  private _applyTheme() {
    if (this.themeMode === 'auto') {
      const prefersDark =
        this._prefersDarkQuery?.matches ??
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.dataset['mdTheme'] = prefersDark
        ? 'dark'
        : 'light';
    } else {
      document.documentElement.dataset['mdTheme'] = this.themeMode;
    }
  }

  private _getTooltipText(type: 'rtl', checked: boolean): string {
    return this.tooltipTexts[type][checked ? 1 : 0];
  }

  private _toggleThemeMenu() {
    const menu = this.shadowRoot?.querySelector('#theme-menu') as any;
    if (menu) {
      menu.open = !menu.open;
    }
  }

  private _handleThemeSelect(e: CustomEvent) {
    const selectedItem = e.detail.item as HTMLElement;
    const themeValue = selectedItem.dataset.theme as 'light' | 'dark' | 'auto';
    if (themeValue) {
      this.themeMode = themeValue;
      this._applyTheme();
      this._saveThemePreference();
    }
  }

  private _handleDir(e: CustomEvent) {
    this.rtl = e.detail;
    document.documentElement.dir = this.rtl ? 'rtl' : 'ltr';
  }

  private _handleScrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private _handleGithubClick() {
    window.open(this.githubUrl, '_blank');
  }

  override render() {
    return html`
      <md-menu
        id="theme-menu"
        for="action-toggle-theme"
        align="top-end"
        alignStrategy="fixed"
        @select=${this._handleThemeSelect}
      >
        <md-menu-item
          data-theme="light"
          ?selected=${this.themeMode === 'light'}
        >
          Light
        </md-menu-item>
        <md-menu-item data-theme="dark" ?selected=${this.themeMode === 'dark'}>
          Dark
        </md-menu-item>
        <md-menu-item data-theme="auto" ?selected=${this.themeMode === 'auto'}>
          Device Default
        </md-menu-item>
      </md-menu>

      <md-toolbar type="floating" color="vibrant">
        <md-icon-button
          id="action-open-repo"
          aria-label="GitHub repository"
          @click=${this._handleGithubClick}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="m9.6 14.908l.708-.714L8.114 12l2.174-2.175l-.707-.713L6.692 12zm4.8 0L17.308 12L14.4 9.092l-.708.714L15.887 12l-2.195 2.194zM5.616 20q-.691 0-1.153-.462T4 18.384V5.616q0-.691.463-1.153T5.616 4h12.769q.69 0 1.153.463T20 5.616v12.769q0 .69-.462 1.153T18.384 20zm0-1h12.769q.23 0 .423-.192t.192-.424V5.616q0-.231-.192-.424T18.384 5H5.616q-.231 0-.424.192T5 5.616v12.769q0 .23.192.423t.423.192M5 5v14z"
            />
          </svg>
        </md-icon-button>
        <md-tooltip for="action-open-repo">View source code</md-tooltip>

        <md-icon-button-toggle
          id="action-toggle-direction"
          variant="tonal"
          ?checked=${this.rtl}
          @change=${this._handleDir}
        >
          <svg
            aria-label="Set direction to RTL"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M10.135 14.5V9.73h-.443q-1.4 0-2.373-.982t-.973-2.382t.973-2.383T9.692 3h6.231v1h-1.884v10.5h-1V4h-1.905v10.5zm-4.239 3.827l1.985 1.965l-.708.708L4 17.808l3.173-3.174l.727.728l-1.984 1.965H20v1zm4.239-9.596V4h-.443q-.978 0-1.662.696q-.684.695-.684 1.672q0 .976.684 1.67q.684.693 1.662.693zm0-2.365"
            />
          </svg>
          <svg
            slot="checked"
            aria-label="Set direction to LTR"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M10.135 14.5V9.73h-.443q-1.4 0-2.373-.982t-.973-2.382t.973-2.383T9.692 3h6.231v1h-1.884v10.5h-1V4h-1.905v10.5zm0-5.77V4h-.443q-.978 0-1.662.696q-.684.695-.684 1.672q0 .976.684 1.67q.684.693 1.662.693zM16.827 21l-.708-.708l1.966-1.965H4v-1h14.066L16.1 15.361l.727-.726L20 17.808z"
            />
          </svg>
        </md-icon-button-toggle>
        <md-tooltip for="action-toggle-direction">
          ${this._getTooltipText('rtl', this.rtl)}
        </md-tooltip>

        <md-icon-button
          id="action-toggle-theme"
          @click=${this._toggleThemeMenu}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M11.962 21q-1.839 0-3.471-.71q-1.633-.711-2.851-1.93T3.71 15.5T3 12q0-1.883.726-3.525t1.979-2.858t2.94-1.916T12.238 3q1.75 0 3.332.591q1.583.592 2.786 1.64q1.203 1.05 1.923 2.5t.72 3.165q0 2.318-1.336 3.71T16 16h-1.773q-.629 0-1.053.433t-.424 1.044q0 .627.375 1.064t.375 1.009q0 .73-.409 1.09q-.408.36-1.13.36M6.5 12.5q.42 0 .71-.29t.29-.71t-.29-.71t-.71-.29t-.71.29t-.29.71t.29.71t.71.29m3-4q.42 0 .71-.29t.29-.71t-.29-.71t-.71-.29t-.71.29t-.29.71t.29.71t.71.29m5 0q.42 0 .71-.29t.29-.71t-.29-.71t-.71-.29t-.71.29t-.29.71t.29.71t.71.29m3 4q.42 0 .71-.29t.29-.71t-.29-.71t-.71-.29t-.71.29t-.29.71t.29.71t.71.29M11.962 20q.263 0 .4-.115q.138-.116.138-.335q0-.35-.375-.748t-.375-1.31q0-1.088.725-1.79T14.25 15H16q1.88 0 2.94-1.107T20 10.896q0-3.044-2.341-4.97T12.239 4Q8.78 4 6.39 6.325T4 12q0 3.325 2.338 5.663T11.962 20"
            />
          </svg>
        </md-icon-button>
        <md-tooltip for="action-toggle-theme"> Change theme </md-tooltip>

        <md-fab
          slot="fab"
          color="tertiary"
          id="scroll-to-top"
          @click=${this._handleScrollToTop}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M11.5 19V6.921l-5.792 5.793L5 12l7-7l7 7l-.708.714L12.5 6.92V19z"
            />
          </svg>
        </md-fab>
        <md-tooltip for="scroll-to-top">Scroll to top</md-tooltip>
      </md-toolbar>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sd-toolbar': SdToolbar;
  }
}
