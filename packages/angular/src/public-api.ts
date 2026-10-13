/*
 * Public API of @pelagic-ui/angular.
 * Styles: add '@pelagic-ui/core/style.css' to your global styles once.
 */
export * from './lib/button';
export * from './lib/forms';
export * from './lib/display';
export * from './lib/tooltip';
export * from './lib/navigation';
export * from './lib/data-table';
export * from './lib/overlay';
export * from './lib/toast';
export * from './lib/theme';
export { cx, getPageItems, initialsOf, type PageItem, type Variant } from './lib/utils';
export { applyTheme, saveTheme, loadTheme, THEME_STORAGE_KEY } from '@pelagic-ui/core/theme';

import { PlButton } from './lib/button';
import { PlCheckbox, PlInput, PlRadioGroup, PlSegmented, PlSelect, PlSlider, PlSwitch, PlTextarea } from './lib/forms';
import {
  PlAlert,
  PlAvatar,
  PlBadge,
  PlCard,
  PlCardFooter,
  PlCardHeader,
  PlDivider,
  PlEmptyAction,
  PlEmptyState,
  PlProgressBar,
  PlSkeleton,
  PlSkeletonCard,
  PlSkeletonText,
  PlSpinner,
  PlStepper,
  PlTag,
  PlTimeline,
} from './lib/display';
import { PlTooltip } from './lib/tooltip';
import { PlAccordion, PlAccordionPanel, PlBreadcrumb, PlPagination, PlTabPanel, PlTabs } from './lib/navigation';
import { PlCell, PlDataTable } from './lib/data-table';
import { PlDialog, PlDialogFooter, PlDrawer } from './lib/overlay';
import { PlToaster } from './lib/toast';

/** Every Pelagic UI component and directive, for `imports: [PELAGIC_UI]`. */
export const PELAGIC_UI = [
  PlButton,
  PlInput,
  PlTextarea,
  PlSelect,
  PlCheckbox,
  PlSwitch,
  PlRadioGroup,
  PlSegmented,
  PlSlider,
  PlBadge,
  PlTag,
  PlAvatar,
  PlCard,
  PlCardHeader,
  PlCardFooter,
  PlAlert,
  PlEmptyState,
  PlEmptyAction,
  PlDivider,
  PlSpinner,
  PlSkeleton,
  PlSkeletonText,
  PlSkeletonCard,
  PlProgressBar,
  PlStepper,
  PlTimeline,
  PlTooltip,
  PlTabs,
  PlTabPanel,
  PlAccordion,
  PlAccordionPanel,
  PlBreadcrumb,
  PlPagination,
  PlDataTable,
  PlCell,
  PlDialog,
  PlDrawer,
  PlDialogFooter,
  PlToaster,
] as const;
export * from './lib/sound';
export * from './lib/accessibility';
