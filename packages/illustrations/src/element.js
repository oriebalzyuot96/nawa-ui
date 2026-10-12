import { illustrationToSvg, isIllustrationName } from './illustrations.js';

export * from './illustrations.js';

const Base = typeof HTMLElement === 'undefined' ? class {} : HTMLElement;

/**
 * `<oc-illustration name="no-results" [label="…"] [compact] [static]>`
 * Renders in light DOM so theme tokens and page CSS apply. Decorative unless `label` is set.
 */
export class OcIllustrationElement extends Base {
  static observedAttributes = ['name', 'label', 'compact', 'static'];

  connectedCallback() {
    if (!this.style.display) this.style.display = 'block';
    this.render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  render() {
    const name = this.getAttribute('name');
    this.innerHTML = isIllustrationName(name)
      ? illustrationToSvg(name, {
          label: this.getAttribute('label') || '',
          compact: this.hasAttribute('compact'),
          animated: !this.hasAttribute('static'),
        })
      : '';
  }
}

/** Registers the element (idempotent). Called automatically on import in browsers. */
export function defineIllustrationElement(tag = 'oc-illustration') {
  if (typeof customElements === 'undefined' || customElements.get(tag)) return;
  customElements.define(tag, tag === 'oc-illustration' ? OcIllustrationElement : class extends OcIllustrationElement {});
}

defineIllustrationElement();
