// Angular standalone <pl-icon> component, shipped in Angular's partial-compilation
// format (the same format ng-packagr emits), so the Angular CLI linker compiles it
// ahead-of-time in the consuming app. Rendering uses Renderer2 (SSR-safe, no innerHTML).
import * as i0 from '@angular/core';
import { icons } from '../icons.js';
import { iconTree, nextId } from '../core.js';

const truthy = (v) => v === true || v === '' || v === 'true';

export class PlIconComponent {
  constructor(el, renderer) {
    this.el = el;
    this.renderer = renderer;
    /** Icon name (see IconName). */
    this.name = undefined;
    /** 'outline' | 'duotone' | 'solid' */
    this.variant = 'outline';
    this.size = 24;
    /** Accessible name; without it the icon is decorative (aria-hidden). */
    this.label = undefined;
    this.strokeWidth = undefined;
    this.flipRtl = undefined;
    this.spin = false;
    this.uid = nextId();
  }

  ngOnChanges() {
    this.render();
  }

  render() {
    const host = this.el.nativeElement;
    const r = this.renderer;
    for (const child of Array.from(host.childNodes)) r.removeChild(host, child);
    const data = icons[this.name];
    if (!data) return;
    const tree = iconTree(data, {
      variant: this.variant,
      size: this.size,
      title: this.label || undefined,
      strokeWidth: this.strokeWidth,
      flipRtl: this.flipRtl == null ? undefined : truthy(this.flipRtl),
      spin: truthy(this.spin),
      id: this.uid,
    });
    r.appendChild(host, this.build(tree));
  }

  build(node) {
    const r = this.renderer;
    if (typeof node === 'string') return r.createText(node);
    const [tag, attrs, children] = node;
    const el = r.createElement(tag, 'svg');
    for (const k in attrs) if (k !== 'xmlns') r.setAttribute(el, k, attrs[k]);
    if (children) for (const c of children) r.appendChild(el, this.build(c));
    return el;
  }
}

PlIconComponent.ɵfac = i0.ɵɵngDeclareFactory({
  minVersion: '12.0.0',
  version: '17.3.0',
  ngImport: i0,
  type: PlIconComponent,
  deps: [{ token: i0.ElementRef }, { token: i0.Renderer2 }],
  target: i0.ɵɵFactoryTarget.Component,
});

PlIconComponent.ɵcmp = i0.ɵɵngDeclareComponent({
  minVersion: '14.0.0',
  version: '17.3.0',
  type: PlIconComponent,
  isStandalone: true,
  selector: 'pl-icon',
  inputs: {
    name: 'name',
    variant: 'variant',
    size: 'size',
    label: 'label',
    strokeWidth: 'strokeWidth',
    flipRtl: 'flipRtl',
    spin: 'spin',
  },
  usesOnChanges: true,
  ngImport: i0,
  template: '',
  isInline: true,
  styles: [
    ':host{display:inline-flex;vertical-align:-.125em;line-height:0;flex-shrink:0}' +
      ':host svg{display:block;overflow:visible}' +
      '.pl-icon__duo{fill:var(--pl-icon-duotone,currentColor);fill-opacity:var(--pl-icon-duotone-opacity,.22)}' +
      ':host-context([dir=rtl]) .pl-icon--flip-rtl{transform:scaleX(-1)}' +
      '.pl-icon--spin{animation:pl-icon-spin .9s linear infinite;transform-origin:50% 50%}' +
      '@keyframes pl-icon-spin{to{transform:rotate(360deg)}}' +
      '@media (prefers-reduced-motion:reduce){.pl-icon--spin{animation-duration:2.4s}}',
  ],
  changeDetection: i0.ChangeDetectionStrategy.OnPush,
});

export { icons, iconNames } from '../icons.js';
