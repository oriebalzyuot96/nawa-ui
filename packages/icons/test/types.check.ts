// Compile-only checks for the published type declarations (`npm run typecheck`).
import { iconToSvg, icons, isIconName, type IconName, type IconData } from '../dist/icons.js';
import { SearchIcon, Icon, type IconProps } from '../dist/react/index.js';
import { Icon as VueIcon, SearchIcon as VueSearch } from '../dist/vue/index.js';
import search from '../dist/icons/search.js';
import type { PlIconElement } from '../dist/element.js';

const name: IconName = 'arrow-right';
const svg: string = iconToSvg(name, { variant: 'duotone', size: 20, title: 'Next' });
// @ts-expect-error unknown icon names are rejected
iconToSvg('not-an-icon');
const data: IconData = icons.search;
const maybe: string = 'bell';
if (isIconName(maybe)) iconToSvg(maybe);
const props: IconProps = { size: 16, variant: 'solid', title: 'Search', className: 'x', onClick: () => {} };
void [svg, data, props, SearchIcon, Icon, VueIcon, VueSearch, search.name];
declare const el: HTMLElementTagNameMap['pl-icon'];
const typed: PlIconElement = el;
void typed;
