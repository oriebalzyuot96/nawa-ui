export * from './illustrations.js';

/** `<oc-illustration name="…" [label] [compact] [static]>` — light-DOM custom element. */
export declare class OcIllustrationElement extends HTMLElement {
  static observedAttributes: string[];
  render(): void;
}
/** Registers the element (idempotent). Called automatically on import in browsers. */
export declare function defineIllustrationElement(tag?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    'oc-illustration': OcIllustrationElement;
  }
}
