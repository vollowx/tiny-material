import { isServer } from 'lit';
import { customElement } from 'lit/decorators.js';

const wrappedCustomElement = (tagName: string, allowSSR: boolean = true) => {
  if (isServer && !allowSSR) {
    console.log(`[SEELE]: <${tagName}> will not be rendered server-side.`);
    return (cls: any) => cls;
  } else {
    return customElement(tagName);
  }
};

export { wrappedCustomElement as customElement };
