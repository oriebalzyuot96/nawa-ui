// <pl-icon> — framework-free custom element.
//   <pl-icon name="search"></pl-icon>
//   <pl-icon name="bell" variant="duotone" size="20" label="Notifications"></pl-icon>
import { icons } from './icons.js';
import { iconTree, nextId, SVG_NS } from './core.js';

const CSS = `:host{display:inline-flex;vertical-align:-0.125em;line-height:0;flex-shrink:0;color:inherit}
:host([hidden]){display:none}
svg{display:block;overflow:visible}
.pl-icon__duo{fill:var(--pl-icon-duotone,currentColor);fill-opacity:var(--pl-icon-duotone-opacity,.22)}
:host(:dir(rtl)) .pl-icon--flip-rtl{transform:scaleX(-1)}
:host([data-dir=rtl]) .pl-icon--flip-rtl{transform:scaleX(-1)}
.pl-icon--spin{animation:pl-icon-spin .9s linear infinite;transform-origin:50% 50%}
@keyframes pl-icon-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.pl-icon--spin{animation-duration:2.4s}}
@media (forced-colors:active){.pl-icon__duo{fill:currentColor;fill-opacity:.18}}`;

const Base = typeof HTMLElement === 'undefined' ? class {} : HTMLElement;
let sheet;

function build(doc, node) {
  if (typeof node === 'string') return doc.createTextNode(node);
  const [tag, attrs, children] = node;
  const el = doc.createElementNS(SVG_NS, tag);
  for (const k in attrs) if (k !== 'xmlns') el.setAttribute(k, attrs[k]);
  if (children) for (const c of children) el.appendChild(build(doc, c));
  return el;
}

const flag = (el, attr) => {
  const v = el.getAttribute(attr);
  return v === null ? undefined : v !== 'false';
};

export class PlIconElement extends Base {
  static get observedAttributes() {
    return ['name', 'variant', 'size', 'label', 'stroke-width', 'flip-rtl', 'spin'];
  }

  constructor() {
    super();
    this._uid = nextId();
    const root = this.attachShadow({ mode: 'open' });
    if (typeof CSSStyleSheet !== 'undefined' && 'adoptedStyleSheets' in root) {
      if (!sheet) {
        sheet = new CSSStyleSheet();
        sheet.replaceSync(CSS);
      }
      root.adoptedStyleSheets = [sheet];
    } else {
      const style = document.createElement('style');
      style.textContent = CSS;
      root.appendChild(style);
    }
  }

  connectedCallback() {
    // Fallback for engines without :dir(): read the inherited direction once.
    try {
      if (getComputedStyle(this).direction === 'rtl') this.setAttribute('data-dir', 'rtl');
      else this.removeAttribute('data-dir');
    } catch { /* not rendered yet */ }
    this.render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  get name() { return this.getAttribute('name'); }
  set name(v) { this.setAttribute('name', v); }
  get variant() { return this.getAttribute('variant') || 'outline'; }
  set variant(v) { this.setAttribute('variant', v); }
  get size() { return this.getAttribute('size') || '24'; }
  set size(v) { this.setAttribute('size', String(v)); }
  get label() { return this.getAttribute('label'); }
  set label(v) { if (v == null) this.removeAttribute('label'); else this.setAttribute('label', v); }

  render() {
    const root = this.shadowRoot;
    const old = root.querySelector('svg');
    if (old) old.remove();
    const data = icons[this.getAttribute('name')];
    if (!data) return;
    const tree = iconTree(data, {
      variant: this.getAttribute('variant') || 'outline',
      size: this.getAttribute('size') || 24,
      title: this.getAttribute('label') || undefined,
      strokeWidth: this.getAttribute('stroke-width') || undefined,
      flipRtl: flag(this, 'flip-rtl'),
      spin: flag(this, 'spin'),
      id: this._uid,
    });
    root.appendChild(build(root.ownerDocument || document, tree));
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('pl-icon')) {
  customElements.define('pl-icon', PlIconElement);
}
