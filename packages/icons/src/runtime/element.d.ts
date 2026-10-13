import type { IconName, IconVariant } from './icons.js';

/** `<pl-icon name="search" variant="duotone" size="20" label="Search">` */
export declare class PlIconElement extends HTMLElement {
  static readonly observedAttributes: string[];
  name: IconName | (string & {}) | null;
  variant: IconVariant;
  size: string;
  label: string | null;
  render(): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'pl-icon': PlIconElement;
  }
}
