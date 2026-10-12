/*
 * Public API of @nawa-ui/angular.
 * Styles: add '@nawa-ui/core/style.css' to your global styles once.
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
export { applyTheme, saveTheme, loadTheme, THEME_STORAGE_KEY } from '@nawa-ui/core/theme';

import { NwButton } from './lib/button';
import { NwCheckbox, NwInput, NwRadioGroup, NwSegmented, NwSelect, NwSlider, NwSwitch, NwTextarea } from './lib/forms';
import {
  NwAlert,
  NwAvatar,
  NwBadge,
  NwCard,
  NwCardFooter,
  NwCardHeader,
  NwDivider,
  NwEmptyAction,
  NwEmptyState,
  NwProgressBar,
  NwSkeleton,
  NwSkeletonCard,
  NwSkeletonText,
  NwSpinner,
  NwStepper,
  NwTag,
  NwTimeline,
} from './lib/display';
import { NwTooltip } from './lib/tooltip';
import { NwAccordion, NwAccordionPanel, NwBreadcrumb, NwPagination, NwTabPanel, NwTabs } from './lib/navigation';
import { NwCell, NwDataTable } from './lib/data-table';
import { NwDialog, NwDialogFooter, NwDrawer } from './lib/overlay';
import { NwToaster } from './lib/toast';

/** Every Nawa UI component and directive, for `imports: [NAWA_UI]`. */
export const NAWA_UI = [
  NwButton,
  NwInput,
  NwTextarea,
  NwSelect,
  NwCheckbox,
  NwSwitch,
  NwRadioGroup,
  NwSegmented,
  NwSlider,
  NwBadge,
  NwTag,
  NwAvatar,
  NwCard,
  NwCardHeader,
  NwCardFooter,
  NwAlert,
  NwEmptyState,
  NwEmptyAction,
  NwDivider,
  NwSpinner,
  NwSkeleton,
  NwSkeletonText,
  NwSkeletonCard,
  NwProgressBar,
  NwStepper,
  NwTimeline,
  NwTooltip,
  NwTabs,
  NwTabPanel,
  NwAccordion,
  NwAccordionPanel,
  NwBreadcrumb,
  NwPagination,
  NwDataTable,
  NwCell,
  NwDialog,
  NwDrawer,
  NwDialogFooter,
  NwToaster,
] as const;
