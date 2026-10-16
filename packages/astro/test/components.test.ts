// Server-render every component with Astro's container API and check the markup / ARIA.
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readdirSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { beforeAll, describe, expect, it } from 'vitest';
import AccessibilityPanel from '../src/components/AccessibilityPanel.astro';
import Accordion from '../src/components/Accordion.astro';
import Alert from '../src/components/Alert.astro';
import Avatar from '../src/components/Avatar.astro';
import Badge from '../src/components/Badge.astro';
import Breadcrumb from '../src/components/Breadcrumb.astro';
import Button from '../src/components/Button.astro';
import Card from '../src/components/Card.astro';
import Checkbox from '../src/components/Checkbox.astro';
import DataTable from '../src/components/DataTable.astro';
import Dialog from '../src/components/Dialog.astro';
import Divider from '../src/components/Divider.astro';
import Drawer from '../src/components/Drawer.astro';
import EmptyState from '../src/components/EmptyState.astro';
import Input from '../src/components/Input.astro';
import Pagination from '../src/components/Pagination.astro';
import ProgressBar from '../src/components/ProgressBar.astro';
import RadioGroup from '../src/components/RadioGroup.astro';
import Segmented from '../src/components/Segmented.astro';
import Select from '../src/components/Select.astro';
import Skeleton from '../src/components/Skeleton.astro';
import SkeletonCard from '../src/components/SkeletonCard.astro';
import SkeletonText from '../src/components/SkeletonText.astro';
import Slider from '../src/components/Slider.astro';
import Spinner from '../src/components/Spinner.astro';
import Stepper from '../src/components/Stepper.astro';
import Switch from '../src/components/Switch.astro';
import Tabs from '../src/components/Tabs.astro';
import Tag from '../src/components/Tag.astro';
import Textarea from '../src/components/Textarea.astro';
import ThemeScript from '../src/components/ThemeScript.astro';
import Timeline from '../src/components/Timeline.astro';
import Toaster from '../src/components/Toaster.astro';
import Tooltip from '../src/components/Tooltip.astro';
import { getPageItems } from '../src/utils';

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

type Component = Parameters<AstroContainer['renderToString']>[0];

/** Render to a detached document fragment for querying. */
async function render(component: Component, props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  const html = await container.renderToString(component, { props, slots });
  const { document } = new JSDOM(`<!doctype html><body>${html}</body>`).window;
  return { html, document, body: document.body, $: (s: string) => document.querySelector(s), $$: (s: string) => [...document.querySelectorAll(s)] };
}

const tested = new Set<string>();
const mark = (name: string) => tested.add(name);

describe('Astro components', () => {
  it('Button: type, variants, loading state', async () => {
    mark('Button');
    let r = await render(Button, { variant: 'outline', size: 'sm', block: true, iconOnly: true, 'aria-label': 'Edit' }, { default: '✎' });
    const btn = r.$('button')!;
    expect(btn.getAttribute('type')).toBe('button');
    expect([...btn.classList]).toEqual(['pl-btn', 'pl-btn--outline', 'pl-btn--sm', 'pl-btn--block', 'pl-btn--icon']);
    expect(btn.getAttribute('aria-label')).toBe('Edit');
    expect(btn.hasAttribute('disabled')).toBe(false);
    expect(btn.hasAttribute('aria-busy')).toBe(false);

    r = await render(Button, { loading: true, type: 'submit' }, { default: 'Save' });
    const loading = r.$('button')!;
    expect(loading.getAttribute('type')).toBe('submit');
    expect(loading.getAttribute('aria-busy')).toBe('true');
    expect(loading.hasAttribute('disabled')).toBe(true);
    expect(loading.querySelector('.pl-spinner')!.getAttribute('aria-hidden')).toBe('true');
    expect(loading.textContent!.trim()).toBe('Save');

    r = await render(Button, { disabled: true }, { default: 'Off' });
    expect(r.$('button')!.hasAttribute('disabled')).toBe(true);
  });

  it('Input: label, hint, error wiring', async () => {
    mark('Input');
    let r = await render(Input, { label: 'Email', hint: 'Work address', id: 'email', type: 'email', name: 'email' });
    const input = r.$('input')!;
    expect(r.$('label')!.getAttribute('for')).toBe('email');
    expect(input.getAttribute('type')).toBe('email');
    expect(input.getAttribute('aria-describedby')).toBe('email-hint');
    expect(r.$('#email-hint')!.textContent).toBe('Work address');
    expect(input.hasAttribute('aria-invalid')).toBe(false);

    r = await render(Input, { label: 'Email', hint: 'ignored', error: 'Required', id: 'e2' });
    expect(r.$('input')!.getAttribute('aria-invalid')).toBe('true');
    expect(r.$('input')!.getAttribute('aria-describedby')).toBe('e2-err');
    expect(r.$('#e2-err')!.textContent).toBe('Required');
    expect(r.$('.pl-hint')).toBeNull();
    expect(r.$('.pl-field')!.classList.contains('pl-field--error')).toBe(true);

    r = await render(Input, { label: 'Auto id' });
    const id = r.$('input')!.id;
    expect(id).toMatch(/^pl-input-/);
    expect(r.$('label')!.getAttribute('for')).toBe(id);
  });

  it('Textarea: label, value and error', async () => {
    mark('Textarea');
    const r = await render(Textarea, { label: 'Bio', value: 'Hello', error: 'Too short', id: 'bio' });
    const ta = r.$('textarea')!;
    expect(ta.textContent).toBe('Hello');
    expect(r.$('label')!.getAttribute('for')).toBe('bio');
    expect(ta.getAttribute('aria-invalid')).toBe('true');
    expect(ta.getAttribute('aria-describedby')).toBe('bio-err');
  });

  it('Select: placeholder, selected and disabled options', async () => {
    mark('Select');
    const r = await render(Select, {
      label: 'Fruit',
      id: 'fruit',
      placeholder: 'Pick one',
      value: 'pear',
      hint: 'Seasonal',
      options: [
        { label: 'Apple', value: 'apple' },
        { label: 'Pear', value: 'pear' },
        { label: 'Fig', value: 'fig', disabled: true },
      ],
    });
    const options = r.$$('option') as HTMLOptionElement[];
    expect(options.map((o) => o.textContent)).toEqual(['Pick one', 'Apple', 'Pear', 'Fig']);
    expect(options[0].value).toBe('');
    expect(options[2].hasAttribute('selected')).toBe(true);
    expect(options[3].hasAttribute('disabled')).toBe(true);
    expect(r.$('select')!.getAttribute('aria-describedby')).toBe('fruit-hint');
  });

  it('Checkbox: native checkbox inside its label', async () => {
    mark('Checkbox');
    const r = await render(Checkbox, { label: 'Agree', checked: true, disabled: true, name: 'terms' });
    const input = r.$('label.pl-check input[type="checkbox"]')!;
    expect(input.hasAttribute('checked')).toBe(true);
    expect(input.hasAttribute('disabled')).toBe(true);
    expect(input.getAttribute('name')).toBe('terms');
    expect(r.$('label')!.classList.contains('pl-check--disabled')).toBe(true);
    expect(r.$('label')!.textContent!.trim()).toBe('Agree');
  });

  it('Switch: role switch, label wiring and hidden form input', async () => {
    mark('Switch');
    let r = await render(Switch, { label: 'Wi-Fi', id: 'wifi', name: 'wifi', checked: true });
    const sw = r.$('[role="switch"]')!;
    expect(sw.tagName).toBe('BUTTON');
    expect(sw.getAttribute('type')).toBe('button');
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(sw.getAttribute('aria-labelledby')).toBe('wifi-label');
    expect(r.$('#wifi-label')!.textContent).toBe('Wi-Fi');
    expect(sw.hasAttribute('data-pl-switch')).toBe(true);
    const hidden = r.$('input[type="hidden"]') as HTMLInputElement;
    expect(hidden.name).toBe('wifi');
    expect(hidden.value).toBe('on');
    expect(sw.nextElementSibling).toBe(hidden);

    r = await render(Switch, { label: 'Dark mode', showLabel: false, disabled: true });
    const quiet = r.$('[role="switch"]')!;
    expect(quiet.getAttribute('aria-label')).toBe('Dark mode');
    expect(quiet.hasAttribute('aria-labelledby')).toBe(false);
    expect(quiet.getAttribute('aria-checked')).toBe('false');
    expect(quiet.hasAttribute('disabled')).toBe(true);
    expect(r.$('input[type="hidden"]')).toBeNull();
  });

  it('RadioGroup: fieldset with legend and native radios', async () => {
    mark('RadioGroup');
    const r = await render(RadioGroup, {
      name: 'size',
      label: 'Size',
      value: 'm',
      options: [
        { label: 'S', value: 's' },
        { label: 'M', value: 'm' },
        { label: 'L', value: 'l', disabled: true },
      ],
    });
    expect(r.$('fieldset > legend')!.textContent).toBe('Size');
    const radios = r.$$('input[type="radio"]') as HTMLInputElement[];
    expect(radios.map((x) => x.name)).toEqual(['size', 'size', 'size']);
    expect(radios[1].hasAttribute('checked')).toBe(true);
    expect(radios[2].hasAttribute('disabled')).toBe(true);
  });

  it('Segmented: labelled radiogroup built on visually hidden radios', async () => {
    mark('Segmented');
    const r = await render(Segmented, { name: 'view', label: 'View', options: [{ label: 'List', value: 'list' }, { label: 'Grid', value: 'grid' }] });
    const group = r.$('[role="radiogroup"]')!;
    expect(group.getAttribute('aria-label')).toBe('View');
    const radios = r.$$('input[type="radio"]');
    expect(radios).toHaveLength(2);
    expect(radios[0].hasAttribute('checked')).toBe(true); // defaults to the first option
    expect(radios[0].classList.contains('pl-sr-only')).toBe(true);
    expect(radios[0].closest('label')!.textContent!.trim()).toBe('List');
  });

  it('Slider: labelled range with optional live output', async () => {
    mark('Slider');
    let r = await render(Slider, { label: 'Volume', value: 30, min: 0, max: 50, step: 5, showValue: true, name: 'vol' });
    const input = r.$('input[type="range"]') as HTMLInputElement;
    expect(r.$('label')!.getAttribute('for')).toBe(input.id);
    expect(input.getAttribute('value')).toBe('30');
    expect(input.getAttribute('max')).toBe('50');
    expect(input.getAttribute('step')).toBe('5');
    const output = r.$('output')!;
    expect(output.id).toBe(`${input.id}-out`);
    expect(output.getAttribute('for')).toBe(input.id);
    expect(input.dataset.plOutput).toBe(output.id);

    r = await render(Slider, { label: 'Quiet' });
    expect(r.$('output')).toBeNull();
    expect(r.$('input')!.hasAttribute('data-pl-output')).toBe(false);
    expect(r.$('input')!.getAttribute('value')).toBe('50');
  });

  it('Badge and Tag', async () => {
    mark('Badge');
    mark('Tag');
    let r = await render(Badge, { variant: 'warning' }, { default: 'Beta' });
    expect(r.$('span')!.className).toBe('pl-badge pl-badge--warning');
    r = await render(Badge, {}, { default: 'Neutral' });
    expect(r.$('span')!.className).toBe('pl-badge');
    r = await render(Tag, { removeHref: '?remove=design' }, { default: 'design' });
    const remove = r.$('a.pl-tag__remove')!;
    expect(remove.getAttribute('aria-label')).toBe('Remove');
    expect(remove.getAttribute('href')).toBe('?remove=design');
    r = await render(Tag, {}, { default: 'static' });
    expect(r.$('a')).toBeNull();
  });

  it('Avatar: role img with name, initials or decorative image', async () => {
    mark('Avatar');
    let r = await render(Avatar, { name: 'Grace Brewster Hopper', size: 'sm' });
    const av = r.$('[role="img"]')!;
    expect(av.getAttribute('aria-label')).toBe('Grace Brewster Hopper');
    expect(av.textContent!.trim()).toBe('GB');
    expect(av.classList.contains('pl-avatar--sm')).toBe(true);
    r = await render(Avatar, { name: 'Ada', src: '/ada.png' });
    expect(r.$('img')!.getAttribute('alt')).toBe('');
  });

  it('Alert: role alert for urgent variants, status otherwise', async () => {
    mark('Alert');
    let r = await render(Alert, { variant: 'danger', title: 'Failed' }, { default: 'Try again' });
    expect(r.$('.pl-alert')!.getAttribute('role')).toBe('alert');
    expect(r.$('.pl-alert__title')!.textContent).toBe('Failed');
    r = await render(Alert, { variant: 'warning' }, { default: 'Careful' });
    expect(r.$('.pl-alert')!.getAttribute('role')).toBe('alert');
    r = await render(Alert, {}, { default: 'FYI' });
    expect(r.$('.pl-alert')!.getAttribute('role')).toBe('status');
    expect(r.$('.pl-alert__title')).toBeNull();
  });

  it('Card: header, body and optional footer', async () => {
    mark('Card');
    let r = await render(Card, { title: 'Plan' }, { default: 'Body', footer: 'Foot' });
    expect(r.$('article.pl-card > header')!.textContent).toBe('Plan');
    expect(r.$('.pl-card__body')!.textContent).toBe('Body');
    expect(r.$('footer')!.textContent).toBe('Foot');
    r = await render(Card, {}, { default: 'Only body' });
    expect(r.$('header')).toBeNull();
    expect(r.$('footer')).toBeNull();
  });

  it('Spinner and ProgressBar', async () => {
    mark('Spinner');
    mark('ProgressBar');
    let r = await render(Spinner, { size: 'lg', label: 'Saving' });
    expect(r.$('[role="status"]')!.getAttribute('aria-label')).toBe('Saving');
    expect(r.$('.pl-spinner--lg')).not.toBeNull();
    r = await render(ProgressBar, { value: -5, label: 'Upload' });
    const bar = r.$('[role="progressbar"]')!;
    expect(bar.getAttribute('aria-label')).toBe('Upload');
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(r.$('.pl-progress__bar')!.getAttribute('style')).toBe('width:0%');
    r = await render(ProgressBar, {});
    expect(r.$('[role="progressbar"]')!.hasAttribute('aria-valuenow')).toBe(false);
    expect(r.$('.pl-progress--indeterminate')).not.toBeNull();
  });

  it('Skeleton, SkeletonText, SkeletonCard', async () => {
    mark('Skeleton');
    mark('SkeletonText');
    mark('SkeletonCard');
    let r = await render(Skeleton, { width: 80, height: '1rem' });
    expect(r.$('.pl-skeleton')!.getAttribute('aria-hidden')).toBe('true');
    expect(r.$('.pl-skeleton')!.getAttribute('style')).toBe('width:80px;height:1rem;');
    r = await render(Skeleton, { circle: true, height: 32 });
    expect(r.$('.pl-skeleton--circle')!.getAttribute('style')).toBe('width:32px;height:32px;');
    r = await render(SkeletonText, { lines: 4, label: 'Loading post' });
    const st = r.$('[role="status"]')!;
    expect(st.getAttribute('aria-busy')).toBe('true');
    expect(st.querySelector('.pl-sr-only')!.textContent).toBe('Loading post');
    expect(st.querySelectorAll('.pl-skeleton[aria-hidden="true"]')).toHaveLength(4);
    r = await render(SkeletonCard, { lines: 2 });
    const sc = r.$('[role="status"]')!;
    expect(sc.getAttribute('aria-busy')).toBe('true');
    expect(sc.querySelector('.pl-sr-only')!.textContent).toBe('Loading…');
    // every visual placeholder sits inside an aria-hidden subtree
    for (const s of sc.querySelectorAll('.pl-skeleton')) expect(s.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(sc.querySelectorAll('.pl-skeleton')).toHaveLength(1 + 2 + 2);
  });

  it('Stepper and Timeline', async () => {
    mark('Stepper');
    mark('Timeline');
    let r = await render(Stepper, { current: 2, steps: [{ label: 'A' }, { label: 'B' }, { label: 'C', description: 'Last' }] });
    const steps = r.$$('ol.pl-stepper > li') as HTMLElement[];
    expect(steps.map((s) => s.dataset.state)).toEqual(['complete', 'complete', 'current']);
    expect(steps[2].getAttribute('aria-current')).toBe('step');
    expect(steps[0].hasAttribute('aria-current')).toBe(false);
    r = await render(Timeline, { items: [{ title: 'Paid', variant: 'danger', time: 'now', description: 'card' }, { title: 'Open' }] });
    const items = r.$$('ol.pl-timeline > li');
    expect(items).toHaveLength(2);
    expect(items[0].querySelector('.pl-timeline__dot--danger')!.getAttribute('aria-hidden')).toBe('true');
    expect(items[0].querySelector('.pl-timeline__time')!.textContent).toBe('now');
    expect(items[1].querySelector('.pl-timeline__time')).toBeNull();
  });

  it('EmptyState and Divider', async () => {
    mark('EmptyState');
    mark('Divider');
    let r = await render(EmptyState, { title: 'Nothing here', description: 'Add one' }, { icon: '★', action: 'Create' });
    expect(r.$('.pl-empty__icon')!.getAttribute('aria-hidden')).toBe('true');
    expect(r.$('.pl-empty__desc')!.textContent).toBe('Add one');
    expect(r.$('.pl-empty__action')!.textContent).toBe('Create');
    r = await render(EmptyState, { title: 'Bare' });
    expect(r.$('.pl-empty__icon')).toBeNull();
    expect(r.$('.pl-empty__action')).toBeNull();
    r = await render(Divider);
    expect(r.$('hr.pl-divider')).not.toBeNull();
  });

  it('EmptyState: heading level, sizes, tones, actions order and illustrations', async () => {
    let r = await render(EmptyState, { title: 'No results', description: 'Try again' }, { primary: 'Clear', secondary: 'Help', action: 'Legacy' });
    expect(r.$('h3.pl-empty__title')!.textContent).toBe('No results');
    expect(r.$('.pl-empty__actions')!.textContent).toBe('ClearHelpLegacy');
    expect(r.$('.pl-empty__media')).toBeNull();
    r = await render(EmptyState, { title: 'Down', size: 'page', align: 'start', layout: 'split', tone: 'danger', headingLevel: 1 });
    expect(r.$('.pl-empty')!.className).toBe('pl-empty pl-empty--page pl-empty--start pl-empty--split pl-empty--tone-danger');
    expect(r.$('h1.pl-empty__title')!.textContent).toBe('Down');
    r = await render(EmptyState, { title: 'Inline', headingLevel: false, size: 'compact', illustration: 'no-results' });
    expect(r.$('p.pl-empty__title')).not.toBeNull();
    expect(r.$('h1, h2, h3, h4, h5, h6')).toBeNull();
    const el = r.$('.pl-empty__media pl-illustration')!;
    expect(el.getAttribute('name')).toBe('no-results');
    expect(el.hasAttribute('compact')).toBe(true);
    r = await render(EmptyState, { title: 'Slot' }, { illustration: 'ART' });
    expect(r.$('.pl-empty__media')!.textContent).toBe('ART');
  });

  it('Breadcrumb: nav landmark and aria-current on the last item', async () => {
    mark('Breadcrumb');
    const r = await render(Breadcrumb, { items: [{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'Tabs', href: '/x' }] });
    expect(r.$('nav')!.getAttribute('aria-label')).toBe('Breadcrumb');
    const items = r.$$('li');
    expect(items.map((li) => li.querySelector('a')?.getAttribute('href') ?? null)).toEqual(['/', '/docs', null]);
    expect(items[2].getAttribute('aria-current')).toBe('page');
  });

  it('Pagination: links, aria-current and disabled edges', async () => {
    mark('Pagination');
    expect(getPageItems(6, 12)).toEqual([1, 'ellipsis', 5, 6, 7, 'ellipsis', 12]);
    let r = await render(Pagination, { page: 1, pageCount: 12, href: '/blog?page={page}' });
    expect(r.$('nav')!.getAttribute('aria-label')).toBe('Pagination');
    const first = r.$('nav > :first-child')!;
    expect(first.tagName).toBe('SPAN');
    expect(first.getAttribute('aria-disabled')).toBe('true');
    expect(r.$('[aria-current="page"]')!.getAttribute('href')).toBe('/blog?page=1');
    expect(r.$('a[aria-label="Next page"]')!.getAttribute('href')).toBe('/blog?page=2');
    expect(r.$$('.pl-pagination__ellipsis').every((e) => e.getAttribute('aria-hidden') === 'true')).toBe(true);
    r = await render(Pagination, { page: 12, pageCount: 12, href: '/p/{page}' });
    expect(r.$('a[aria-label="Previous page"]')!.getAttribute('href')).toBe('/p/11');
    expect(r.$('nav > :last-child')!.getAttribute('aria-disabled')).toBe('true');
    expect(r.$('a[aria-label="Page 12"]')!.getAttribute('aria-current')).toBe('page');
  });

  it('Accordion: native details/summary, open and exclusive', async () => {
    mark('Accordion');
    let r = await render(Accordion, { items: [{ title: 'One', content: 'First', open: true }, { title: 'Two', content: 'Second' }], exclusive: true });
    const details = r.$$('details') as HTMLDetailsElement[];
    expect(details).toHaveLength(2);
    expect(details[0].hasAttribute('open')).toBe(true);
    expect(details[1].hasAttribute('open')).toBe(false);
    expect(details.every((d) => d.getAttribute('name') === 'pl-accordion')).toBe(true);
    expect(details[0].querySelector('summary')!.textContent).toContain('One');
    expect(details[0].querySelector('.pl-accordion__icon')!.getAttribute('aria-hidden')).toBe('true');
    r = await render(Accordion, { items: [{ title: 'Solo', content: 'x' }] });
    expect(r.$('details')!.hasAttribute('name')).toBe(false);
  });

  it('Tabs: WAI-ARIA tablist with one visible panel per tab', async () => {
    mark('Tabs');
    const r = await render(
      Tabs,
      { label: 'Settings', value: 'b', tabs: [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }, { key: 'c', label: 'C', disabled: true }] },
      { 'panel-a': 'Alpha', 'panel-b': 'Beta' },
    );
    const list = r.$('[role="tablist"]')!;
    expect(list.getAttribute('aria-label')).toBe('Settings');
    const tabs = r.$$('[role="tab"]');
    const panels = r.$$('[role="tabpanel"]') as HTMLElement[];
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
    expect(tabs[2].hasAttribute('disabled')).toBe(true);
    expect(panels).toHaveLength(3);
    tabs.forEach((t, i) => {
      expect(t.getAttribute('aria-controls')).toBe(panels[i].id);
      expect(panels[i].getAttribute('aria-labelledby')).toBe(t.id);
    });
    expect(panels.map((p) => p.hidden)).toEqual([true, false, true]);
    expect(panels[1].textContent).toBe('Beta');
    expect(r.$('.pl-tabs')!.hasAttribute('data-pl-tabs')).toBe(true);
  });

  it('Tooltip: bubble with role tooltip next to the trigger', async () => {
    mark('Tooltip');
    const r = await render(Tooltip, { text: 'Copy link', placement: 'bottom' }, { default: 'Copy' });
    const wrap = r.$('.pl-tooltip')!;
    expect(wrap.classList.contains('pl-tooltip--bottom')).toBe(true);
    expect(wrap.hasAttribute('data-pl-tooltip')).toBe(true);
    const bubble = r.$('[role="tooltip"]')!;
    expect(bubble.id).toMatch(/^pl-tip-/);
    expect(bubble.textContent).toBe('Copy link');
  });

  it('Dialog and Drawer: native <dialog> labelled by its title with a close button', async () => {
    mark('Dialog');
    mark('Drawer');
    let r = await render(Dialog, { id: 'confirm', title: 'Delete file?', size: 'sm' }, { default: 'Gone forever', footer: 'Buttons' });
    let dialog = r.$('dialog')!;
    expect(dialog.id).toBe('confirm');
    expect(dialog.getAttribute('aria-labelledby')).toBe('confirm-title');
    expect(r.$('#confirm-title')!.tagName).toBe('H2');
    expect(r.$('#confirm-title')!.textContent).toBe('Delete file?');
    expect(dialog.classList.contains('pl-dialog--sm')).toBe(true);
    expect(dialog.hasAttribute('open')).toBe(false);
    const close = r.$('button[data-pl-close]')!;
    expect(close.getAttribute('aria-label')).toBe('Close');
    expect(close.getAttribute('type')).toBe('button');
    expect(r.$('.pl-dialog__footer')!.textContent).toBe('Buttons');

    r = await render(Drawer, { id: 'filters', title: 'Filters', side: 'left' }, { default: 'x' });
    dialog = r.$('dialog')!;
    expect([...dialog.classList]).toEqual(['pl-drawer', 'pl-drawer--left']);
    expect(dialog.getAttribute('aria-labelledby')).toBe('filters-title');
    expect(r.$('footer')).toBeNull();
  });

  it('Toaster: an inert config template for the client region', async () => {
    mark('Toaster');
    const r = await render(Toaster, { position: 'top-start', progress: true });
    const el = r.$('[data-pl-toaster]')!;
    expect(el.tagName).toBe('TEMPLATE');
    expect(JSON.parse(el.getAttribute('data-config')!)).toMatchObject({ position: 'top-start', progress: true, closeButton: true });
  });

  it('ThemeScript: inline, render-blocking restore of the saved theme', async () => {
    mark('ThemeScript');
    const r = await render(ThemeScript);
    const script = r.$('script')!;
    expect(script.hasAttribute('src')).toBe(false);
    expect(script.getAttribute('type')).toBeNull();
    expect(script.textContent).toContain("localStorage.getItem('pelagic-ui-theme')");
    // Execute it against a real DOM: it must apply the saved choice and ignore 'system'.
    const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { runScripts: 'outside-only', url: 'https://example.test/' });
    dom.window.localStorage.setItem('pelagic-ui-theme', JSON.stringify({ mode: 'dark', accent: 'rose', shape: 'round' }));
    dom.window.eval(script.textContent!);
    const root = dom.window.document.documentElement;
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(root.getAttribute('data-accent')).toBe('rose');
    expect(root.getAttribute('data-shape')).toBe('round');
    const sys = new JSDOM('', { runScripts: 'outside-only', url: 'https://example.test/' });
    sys.window.localStorage.setItem('pelagic-ui-theme', JSON.stringify({ mode: 'system' }));
    sys.window.eval(script.textContent!);
    expect(sys.window.document.documentElement.hasAttribute('data-theme')).toBe(false);
    const bad = new JSDOM('', { runScripts: 'outside-only', url: 'https://example.test/' });
    bad.window.localStorage.setItem('pelagic-ui-theme', '{oops');
    expect(() => bad.window.eval(script.textContent!)).not.toThrow();
  });

  it('DataTable: caption, scoped headers, server-side sort links', async () => {
    mark('DataTable');
    const rows = [
      { name: 'Charlie', age: 30 },
      { name: 'alice', age: 4 },
      { name: 'Bob', age: null },
    ];
    const columns = [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'age', label: 'Age', sortable: true, align: 'end' },
    ];
    let r = await render(DataTable, { rows, columns, caption: 'People', sort: { key: 'age', direction: 'asc' }, sortHref: '?sort={key}&dir={dir}' });
    expect(r.$('caption')!.textContent).toBe('People');
    expect(r.$('caption')!.className).toBe('pl-sr-only');
    const ths = r.$$('th');
    expect(ths.every((th) => th.getAttribute('scope') === 'col')).toBe(true);
    expect(ths[0].hasAttribute('aria-sort')).toBe(false);
    expect(ths[1].getAttribute('aria-sort')).toBe('ascending');
    expect(ths[1].className).toBe('pl-table__align-end');
    expect(ths[0].querySelector('a')!.getAttribute('href')).toBe('?sort=name&dir=asc');
    expect(ths[1].querySelector('a')!.getAttribute('href')).toBe('?sort=age&dir=desc');
    expect(ths[1].querySelector('[aria-hidden="true"]')!.textContent).toBe('▲');
    const ages = r.$$('tbody tr').map((tr) => tr.children[1].textContent);
    expect(ages).toEqual(['4', '30', '']);

    r = await render(DataTable, { rows, columns, sort: { key: 'name', direction: 'desc' }, captionVisible: true, caption: 'Visible' });
    expect(r.$('caption')!.hasAttribute('class')).toBe(false);
    expect(r.$('th a')).toBeNull(); // no sortHref → plain headers
    expect(r.$$('tbody tr').map((tr) => tr.children[0].textContent)).toEqual(['Charlie', 'Bob', 'alice']);
    expect(r.$('th')!.getAttribute('aria-sort')).toBe('descending');

    r = await render(DataTable, { rows: [], columns, emptyMessage: 'Nobody' });
    const empty = r.$('td.pl-table__empty')!;
    expect(empty.textContent).toBe('Nobody');
    expect(empty.getAttribute('colspan')).toBe('2');
  });

  it('AccessibilityPanel: trigger, labelled dialog, groups, Arabic (behavior: test/a11y-panel.test.ts)', async () => {
    mark('AccessibilityPanel');
    let r = await render(AccessibilityPanel, { id: 'a11y', trigger: 'inline' });
    const trigger = r.$('[data-a11y-open]')!;
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.textContent).toContain('Accessibility');
    const dialog = r.$('.pl-a11y-panel')!;
    // role="dialog" and aria-modal are set by the client script while open; a closed panel is not a dialog.
    expect(dialog.hasAttribute('role')).toBe(false);
    expect(r.$(`#${dialog.getAttribute('data-labelledby')}`)!.textContent).toBe('Accessibility');
    expect(dialog.hasAttribute('hidden')).toBe(true);
    expect(r.$$('.pl-a11y-group__title').map((h) => h.textContent)).toEqual(['Theme', 'Contrast & color', 'Text', 'Reading aids', 'Motion & media', 'Interaction', 'Sound']);
    expect(r.$$('[role="radiogroup"][data-a11y-key="contrast"] [role="radio"]')).toHaveLength(8);
    expect(r.$('[role="status"][aria-live="polite"]')).not.toBeNull();
    expect(r.html).toContain('localStorage.getItem(storageKey)');
    expect(r.html).toContain('pelagic-ui-a11y');

    r = await render(AccessibilityPanel, { locale: 'ar', groups: ['text'], preview: false, persist: false });
    expect(r.$('.pl-a11y-panel')!.getAttribute('dir')).toBe('rtl');
    expect(r.$('[data-a11y-open]')!.getAttribute('aria-label')).toBe('إعدادات إمكانية الوصول');
    expect(r.$$('.pl-a11y-group')).toHaveLength(1);
    expect(r.$('.pl-a11y-preview')).toBeNull();
    expect(r.$('[data-pl-a11y-host]')!.getAttribute('data-persist')).toBe('false');
    expect(r.html).not.toContain('localStorage.getItem(storageKey)');
  });

  it('covers every component in src/components', () => {
    const files = readdirSync(new URL('../src/components', import.meta.url)).filter((f) => f.endsWith('.astro')).map((f) => f.replace('.astro', ''));
    expect(files.filter((f) => !tested.has(f))).toEqual([]);
  });
});
