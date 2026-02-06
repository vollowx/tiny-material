import { LitElement } from 'lit';
import { internals } from './internals-attached';

export declare class FocusDelegatedInterface {}

export const FocusDelegated = <T extends Constructor<LitElement>>(
  superClass: T
) => {
  class FocusDelegatedElement extends superClass {
    static shadowRootOptions: ShadowRootInit = {
      ...LitElement.shadowRootOptions,
      delegatesFocus: true,
    };

    constructor(...args: any[]) {
      super();
      this[internals].role = 'presentation';
    }
  }
  return FocusDelegatedElement as Constructor<FocusDelegatedInterface> & T;
};
