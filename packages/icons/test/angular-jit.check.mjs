// Manual check (not part of `npm test`): JIT-compiles the partial-declared Angular
// component with jsdom and renders it. Requires @angular/{core,compiler,platform-browser} + jsdom.
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html dir="rtl"><body></body></html>');
Object.assign(globalThis, { window: dom.window, document: dom.window.document, Node: dom.window.Node, Element: dom.window.Element, HTMLElement: dom.window.HTMLElement });
await import('@angular/compiler');
const { createApplication } = await import('@angular/platform-browser');
const { createComponent, provideZonelessChangeDetection } = await import('@angular/core');
const { PlIconComponent } = await import('../dist/angular/index.js');
const app = await createApplication({ providers: [provideZonelessChangeDetection()] });
const host = document.createElement('pl-icon');
document.body.appendChild(host);
const ref = createComponent(PlIconComponent, { environmentInjector: app.injector, hostElement: host });
ref.setInput('name', 'arrow-right');
ref.setInput('variant', 'duotone');
ref.setInput('label', 'Next');
ref.changeDetectorRef.detectChanges();
const svg = host.querySelector('svg');
if (!svg || svg.namespaceURI !== 'http://www.w3.org/2000/svg') throw new Error('no svg rendered');
if (svg.getAttribute('role') !== 'img' || !host.querySelector('title')) throw new Error('label not applied');
if (!svg.classList.contains('pl-icon--flip-rtl')) throw new Error('rtl flag missing');
ref.setInput('label', undefined);
ref.setInput('name', 'search');
ref.changeDetectorRef.detectChanges();
if (host.querySelector('svg').getAttribute('aria-hidden') !== 'true' || host.querySelectorAll('svg').length !== 1) throw new Error('re-render failed');
console.log('angular OK:', host.innerHTML.slice(0, 160));
process.exit(0);
