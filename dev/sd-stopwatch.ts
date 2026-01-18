import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sd-stopwatch')
export class SDStopwatch extends LitElement {
  static override styles = css`
    :host {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
      align-items: center;
      justify-content: center;
      user-select: none;
    }
    .time {
      font: var(--md-sys-typography-headline-large);
      font-family: monospace;
    }
    .controls {
      display: flex;
      gap: 8px;
    }
  `;
  @state()
  private running = false;

  @state()
  private elapsed = 0; // in milliseconds

  private intervalId: number | null = null;

  private startTime: number | null = null;

  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    const milliseconds = Math.floor(ms % 1000)
      .toString()
      .padStart(3, '0');
    return `${minutes}:${seconds}.${milliseconds}`;
  }

  private start() {
    if (this.running) return;
    this.running = true;
    this.startTime = performance.now() - this.elapsed;
    this.intervalId = window.setInterval(() => {
      if (this.startTime !== null) {
        this.elapsed = performance.now() - this.startTime;
      }
    }, 10);
  }

  private stop() {
    if (!this.running) return;
    this.running = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private reset() {
    this.stop();
    this.elapsed = 0;
    this.startTime = null;
  }

  override render() {
    return html`
      <div
        class="time"
        aria-label="Time elapsed: ${this.formatTime(this.elapsed)}"
      >
        ${this.formatTime(this.elapsed)}
      </div>
      <div class="controls">
        <md-button-toggle
          @change="${() => (this.running ? this.stop() : this.start())}"
          ?checked="${!this.running}"
        >
          <span>Stop</span>
          <span slot="checked">Start</span>
        </md-button-toggle>
        <md-icon-button
          variant="outlined"
          width="narrow"
          aria-label="Reset"
          @click="${this.reset}"
          ?disabled="${this.elapsed === 0}"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M12 20q-3.35 0-5.675-2.325T4 12t2.325-5.675T12 4q1.725 0 3.3.712T18 6.75V4h2v7h-7V9h4.2q-.8-1.4-2.187-2.2T12 6Q9.5 6 7.75 7.75T6 12t1.75 4.25T12 18q1.925 0 3.475-1.1T17.65 14h2.1q-.7 2.65-2.85 4.325T12 20"
            />
          </svg>
        </md-icon-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sd-stopwatch': SDStopwatch;
  }
}
