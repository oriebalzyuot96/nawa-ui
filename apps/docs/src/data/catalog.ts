// The component catalog: one entry per category page under /components/<slug>/.
import type { CategoryDoc } from './docs/types';
import { forms } from './docs/forms';
import { advancedForms } from './docs/advanced-forms';
import { data } from './docs/data';
import { panels } from './docs/panels';
import { overlays } from './docs/overlays';
import { menus } from './docs/menus';
import { media } from './docs/media';
import { feedback } from './docs/feedback';
import { charts } from './docs/charts';
import { threeD } from './docs/three-d';

export const categories: CategoryDoc[] = [forms, advancedForms, data, panels, overlays, menus, media, feedback, charts, threeD];

export const categoryBySlug = (slug: string) => categories.find((c) => c.slug === slug);

/** Number of components documented with a demo across all category pages. */
export const documentedCount = categories.reduce((n, c) => n + c.entries.length, 0);
